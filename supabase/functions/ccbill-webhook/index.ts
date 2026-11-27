// Receives CCBill webhooks and is the only place paid access is granted or taken away.
//
// Set the webhook address in the CCBill Admin Portal (Account Info > Sub Account Admin > Webhooks) to
//   https://<project>.supabase.co/functions/v1/ccbill-webhook?token=<CCBILL_WEBHOOK_TOKEN>
// with format JSON and all subscription events ticked.
//
// Two checks before anything runs:
//   1. the token in the address matches the CCBILL_WEBHOOK_TOKEN secret (constant-time compare)
//   2. the request comes from one of CCBill's four published IP blocks
//      (set CCBILL_SKIP_IP_CHECK=true only if CCBill support confirms a different sender)
// Each webhook is recorded in payment_events first, so a webhook CCBill retries is applied once.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";
import {
  CATALOG, COIN_PREFIX, EVENT_PREFIX, eventKey, isCCBillIp, parseWebhookBody, planWebhook, safeEqual,
  type WebhookAction,
} from "../_shared/ccbill-core.ts";

const text = (status: number, body: string) => new Response(body, { status, headers: { "Content-Type": "text/plain" } });

// Fields kept in payment_events. Never names, addresses, emails or card details.
const SUMMARY_FIELDS = [
  "subscriptionId", "transactionId", "timestamp", "nextRenewalDate", "renewalDate", "billedInitialPrice",
  "billedRecurringPrice", "billedAmount", "amount", "failureCode", "failureReason", "reason", "X-product", "X-referenceId",
];

serve(async (req) => {
  if (req.method !== "POST") return text(405, "method not allowed");

  const expected = Deno.env.get("CCBILL_WEBHOOK_TOKEN") ?? "";
  if (!expected) return text(503, "not configured");
  const url = new URL(req.url);
  if (!safeEqual(url.searchParams.get("token") ?? "", expected)) return text(401, "unauthorized");

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  if (Deno.env.get("CCBILL_SKIP_IP_CHECK") !== "true" && !isCCBillIp(ip)) {
    console.warn(`[ccbill-webhook] rejected sender ${ip}`);
    return text(403, "forbidden");
  }

  const eventType = url.searchParams.get("eventType") ?? "";
  const raw = await req.text();
  let body: Record<string, string>;
  try {
    body = parseWebhookBody(req.headers.get("content-type"), raw);
  } catch {
    return text(400, "bad body");
  }
  const accnum = Deno.env.get("CCBILL_CLIENT_ACCNUM");
  const sentAccnum = url.searchParams.get("clientAccnum") ?? body.clientAccnum;
  if (accnum && sentAccnum && sentAccnum !== accnum) return text(403, "wrong account");

  const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
    auth: { persistSession: false },
  });

  const key = eventKey(eventType, body);
  const { data: seen } = await admin.from("payment_events").select("id, outcome").eq("event_key", key).maybeSingle();
  if (seen && seen.outcome !== "error") return text(200, "duplicate");

  const action = planWebhook(eventType, body);
  const summary = Object.fromEntries(SUMMARY_FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));
  const userId = "userId" in action ? action.userId : null;
  if (!seen) {
    const { error } = await admin.from("payment_events").insert({
      event_key: key, event_type: eventType, ccbill_subscription_id: body.subscriptionId ?? null, user_id: userId, summary,
    });
    if (error && !String(error.message).includes("duplicate")) return text(500, "could not record");
  }

  try {
    const outcome = await apply(admin, action);
    await admin.from("payment_events").update({ outcome, error: null }).eq("event_key", key);
    return text(200, "ok");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[ccbill-webhook] ${eventType} failed: ${msg}`);
    await admin.from("payment_events").update({ outcome: "error", error: msg.slice(0, 500) }).eq("event_key", key);
    await admin.from("error_logs").insert({ error_message: `ccbill-webhook ${eventType}: ${msg}`, page_url: "edge:ccbill-webhook" })
      .then(() => {}, () => {});
    return text(500, "error"); // CCBill retries; the retry runs this event again because its outcome is "error"
  }
});

async function apply(db: SupabaseClient, a: WebhookAction): Promise<string> {
  const now = new Date().toISOString();
  const must = <T extends { error: { message: string } | null }>(r: T) => {
    if (r.error) throw new Error(r.error.message);
    return r;
  };

  switch (a.type) {
    case "activate_subscription": {
      must(await db.from("subscriptions").upsert({
        user_id: a.userId, plan: a.plan, status: "active", billing_period: a.billing,
        ccbill_subscription_id: a.subscriptionId, current_period_end: a.periodEnd, source: "ccbill",
        cancel_at_period_end: false, cancelled_at: null, cancel_requested_at: null, updated_at: now,
      }, { onConflict: "user_id" }));
      await referralReward(db, a.userId);
      return `activated ${a.plan} ${a.billing}`;
    }

    case "fulfil_one_time": {
      const ins = await db.from("payment_purchases").insert({
        user_id: a.userId, product_key: a.productKey, reference_id: a.referenceId, ccbill_subscription_id: a.subscriptionId,
        transaction_id: a.transactionId, amount: a.amount,
      });
      if (ins.error) {
        if (String(ins.error.message).includes("duplicate")) return "already fulfilled";
        throw new Error(ins.error.message);
      }
      const product = CATALOG[a.productKey];
      if (product?.kind === "boost") {
        must(await db.from("profile_boosts").insert({ user_id: a.userId }));
        return "boost added";
      }
      if (product?.kind === "thot_pack") {
        const size = product.packSize ?? 0;
        must(await db.from("super_like_purchases").insert({ user_id: a.userId, pack_size: size, stripe_payment_intent_id: a.transactionId }));
        const { data: bal } = await db.from("super_like_balance").select("balance").eq("user_id", a.userId).maybeSingle();
        if (bal) must(await db.from("super_like_balance").update({ balance: bal.balance + size, updated_at: now }).eq("user_id", a.userId));
        else must(await db.from("super_like_balance").insert({ user_id: a.userId, balance: size }));
        return `thot pack ${size} added`;
      }
      if (a.productKey.startsWith(COIN_PREFIX)) {
        const { data: pkg } = await db.from("coin_packages").select("coins, bonus_coins, name").eq("id", a.referenceId).maybeSingle();
        if (!pkg) throw new Error(`coin package ${a.referenceId} not found`);
        const coins = (pkg.coins ?? 0) + (pkg.bonus_coins ?? 0);
        must(await db.rpc("credit_coins", {
          p_user_id: a.userId, p_amount: coins, p_transaction_type: "purchase", p_description: `Bought ${pkg.name}`, p_reference_id: null,
        }));
        return `${coins} coins added`;
      }
      if (a.productKey.startsWith(EVENT_PREFIX)) {
        // stripe_payment_intent_id is the old column name; it now holds the CCBill transaction id.
        must(await db.from("event_registrations").insert({ event_id: a.referenceId, user_id: a.userId, stripe_payment_intent_id: a.transactionId }));
        return "event ticket added";
      }
      throw new Error(`no fulfilment for ${a.productKey}`);
    }

    case "renew": {
      const { data: sub } = await db.from("subscriptions").select("billing_period, current_period_end")
        .eq("ccbill_subscription_id", a.subscriptionId).maybeSingle();
      if (!sub) return "no matching subscription";
      const days = sub.billing_period === "annual" ? 365 : 30;
      const from = sub.current_period_end && new Date(sub.current_period_end) > new Date() ? new Date(sub.current_period_end) : new Date();
      const periodEnd = a.periodEnd ?? new Date(from.getTime() + days * 86_400_000).toISOString();
      must(await db.from("subscriptions").update({ status: "active", current_period_end: periodEnd, updated_at: now })
        .eq("ccbill_subscription_id", a.subscriptionId));
      return "renewed";
    }

    case "renewal_failed":
      // CCBill retries the card itself and sends Expiration if it gives up. Access stays until then.
      return `renewal failed: ${a.reason ?? "no reason given"}`;

    case "mark_cancelled": {
      must(await db.from("subscriptions").update({ cancel_at_period_end: true, cancelled_at: a.at, updated_at: now })
        .eq("ccbill_subscription_id", a.subscriptionId));
      return "cancelled at period end";
    }

    case "expire": {
      must(await db.from("subscriptions").update({ status: "inactive", current_period_end: now, updated_at: now })
        .eq("ccbill_subscription_id", a.subscriptionId));
      return "expired";
    }

    case "reactivate": {
      const patch: Record<string, unknown> = { status: "active", cancel_at_period_end: false, cancelled_at: null, cancel_requested_at: null, updated_at: now };
      if (a.periodEnd) patch.current_period_end = a.periodEnd;
      must(await db.from("subscriptions").update(patch).eq("ccbill_subscription_id", a.subscriptionId));
      return "reactivated";
    }

    case "reverse": {
      const { data: sub } = await db.from("subscriptions").select("user_id").eq("ccbill_subscription_id", a.subscriptionId).maybeSingle();
      if (sub) {
        must(await db.from("subscriptions").update({ status: "inactive", current_period_end: now, updated_at: now })
          .eq("ccbill_subscription_id", a.subscriptionId));
        await audit(db, `subscription_${a.kind}`, { user_id: sub.user_id, subscription_id: a.subscriptionId, amount: a.amount });
        return `subscription ended by ${a.kind}`;
      }
      const { data: buy } = await db.from("payment_purchases").select("*").eq("ccbill_subscription_id", a.subscriptionId).maybeSingle();
      if (!buy) return "nothing to reverse";
      if (buy.status !== "paid") return "already reversed";
      must(await db.from("payment_purchases").update({ status: a.kind, updated_at: now }).eq("id", buy.id));
      const product = CATALOG[buy.product_key];
      if (product?.kind === "thot_pack") {
        const { data: bal } = await db.from("super_like_balance").select("balance").eq("user_id", buy.user_id).maybeSingle();
        if (bal) must(await db.from("super_like_balance").update({ balance: Math.max(0, bal.balance - (product.packSize ?? 0)), updated_at: now }).eq("user_id", buy.user_id));
      } else if (buy.product_key.startsWith(EVENT_PREFIX) && buy.reference_id) {
        must(await db.from("event_registrations").delete().eq("event_id", buy.reference_id).eq("user_id", buy.user_id));
      } else if (buy.product_key.startsWith(COIN_PREFIX)) {
        const { data: pkg } = await db.from("coin_packages").select("coins, bonus_coins").eq("id", buy.reference_id).maybeSingle();
        const { data: prof } = await db.from("profiles").select("thots_coins_balance").eq("id", buy.user_id).maybeSingle();
        const take = Math.min((pkg?.coins ?? 0) + (pkg?.bonus_coins ?? 0), prof?.thots_coins_balance ?? 0);
        if (take > 0) {
          must(await db.rpc("debit_coins", {
            p_user_id: buy.user_id, p_amount: take, p_transaction_type: a.kind, p_description: `Coins reversed (${a.kind})`, p_reference_id: null,
          }));
        }
      }
      // A Profile Boost that already ran can't be taken back; the audit row records it.
      await audit(db, `purchase_${a.kind}`, { user_id: buy.user_id, product: buy.product_key, amount: a.amount });
      return `${buy.product_key} reversed by ${a.kind}`;
    }

    case "sale_failed":
      if (a.userId) {
        await db.from("analytics_events").insert({ user_id: a.userId, event_name: "checkout_failed", event_data: { product: a.productKey, reason: a.reason } })
          .then(() => {}, () => {});
      }
      return "sale failed";

    case "ignore":
      return `ignored: ${a.reason}`;
  }
}

async function audit(db: SupabaseClient, action: string, details: Record<string, unknown>) {
  await db.from("audit_log").insert({ admin_user_id: "00000000-0000-0000-0000-000000000000", action, details }).then(() => {}, () => {});
}

/** A member who joined with a referral code just paid: give the referrer 90 days of Premium once. */
async function referralReward(db: SupabaseClient, userId: string) {
  try {
    const { data: code } = await db.from("promo_codes").select("id, created_by, reward_granted")
      .eq("redeemed_by", userId).eq("type", "referral").eq("referred_subscribed", false).maybeSingle();
    if (!code) return;
    await db.from("promo_codes").update({ referred_subscribed: true }).eq("id", code.id);
    if (code.reward_granted || !code.created_by) return;

    const { data: theirs } = await db.from("subscriptions").select("status, current_period_end, ccbill_subscription_id")
      .eq("user_id", code.created_by).maybeSingle();
    const live = theirs?.status === "active" && (!theirs.current_period_end || new Date(theirs.current_period_end) > new Date());
    if (live && theirs?.ccbill_subscription_id) {
      // A paying referrer can't be given free time through CCBill automatically. Flag it for a manual credit.
      await db.from("error_logs").insert({
        error_message: `Referral reward needs a manual credit: referrer ${code.created_by} already pays through CCBill`,
        page_url: "edge:ccbill-webhook/referral",
      });
      return;
    }
    if (live) return; // already on a free or comped plan
    const until = new Date(Date.now() + 90 * 86_400_000).toISOString();
    await db.from("subscriptions").upsert({
      user_id: code.created_by, plan: "premium", status: "active", source: "referral", current_period_end: until,
      ccbill_subscription_id: null, cancel_at_period_end: true, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    await db.from("promo_codes").update({ reward_granted: true }).eq("id", code.id);
  } catch (e) {
    await db.from("error_logs").insert({ error_message: `Referral reward failed: ${e instanceof Error ? e.message : String(e)}`, page_url: "edge:ccbill-webhook/referral" })
      .then(() => {}, () => {});
  }
}
