// One-tap cancel from Settings > Subscription (ROSCA "simple mechanism"; California: cancel online, same medium).
//
// The member keeps access until the end of the period they paid for. What happens:
//   1. Paid CCBill plan: ask CCBill's DataLink API to stop future charges.
//      Secrets: CCBILL_CLIENT_ACCNUM, CCBILL_SUBACC, CCBILL_DATALINK_USER, CCBILL_DATALINK_PASS.
//   2. If DataLink isn't set up or refuses (for example error -8, an IP address CCBill hasn't approved),
//      the cancel is still recorded here and honoured, and an error_logs row tells the team to cancel it
//      by hand in the CCBill Admin Portal the same day. The member is never told to email or call.
//   3. Free plans (promo, referral, comp) just stop at their end date.
// A confirmation email goes out either way.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { DATALINK_CODES, cancelUrl, parseDataLinkResult } from "../_shared/ccbill-core.ts";
import { sendLoggedTemplateEmail } from "../_shared/transactional-email-templates/send-logged.ts";

const PLAN_NAMES: Record<string, string> = { plus: "Plus", premium: "Premium", vip: "VIP" };

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const reply = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
    auth: { persistSession: false },
  });

  try {
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: auth } = await db.auth.getUser(token);
    const user = auth?.user;
    if (!user) return reply(401, { error: "not_signed_in" });

    const { data: sub } = await db.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle();
    const live = sub?.status === "active" && (!sub.current_period_end || new Date(sub.current_period_end) > new Date());
    if (!sub || !live) return reply(404, { error: "no_active_plan" });
    const accessUntil: string | null = sub.current_period_end;
    if (sub.cancel_at_period_end) return reply(200, { cancelled: true, access_until: accessUntil, already: true });

    const now = new Date().toISOString();
    let processorConfirmed = sub.source !== "ccbill"; // free plans have nothing to stop at the processor
    let processorNote = "";

    if (sub.source === "ccbill" && sub.ccbill_subscription_id) {
      const accnum = Deno.env.get("CCBILL_CLIENT_ACCNUM");
      const subacc = Deno.env.get("CCBILL_SUBACC");
      const dlUser = Deno.env.get("CCBILL_DATALINK_USER");
      const dlPass = Deno.env.get("CCBILL_DATALINK_PASS");
      if (accnum && subacc && dlUser && dlPass) {
        try {
          const res = await fetch(cancelUrl(accnum, subacc, dlUser, dlPass, sub.ccbill_subscription_id), { signal: AbortSignal.timeout(15000) });
          const code = parseDataLinkResult(await res.text());
          processorConfirmed = code === "1";
          if (!processorConfirmed) processorNote = `DataLink ${code ?? "no code"}: ${DATALINK_CODES[code ?? ""] ?? "unknown reply"}`;
        } catch (e) {
          processorNote = `DataLink unreachable: ${e instanceof Error ? e.message : String(e)}`;
        }
      } else {
        processorNote = "DataLink secrets not set";
      }
    }

    const { error: upErr } = await db.from("subscriptions").update({
      cancel_at_period_end: true,
      cancel_requested_at: now,
      cancelled_at: processorConfirmed ? now : sub.cancelled_at,
      updated_at: now,
    }).eq("user_id", user.id);
    if (upErr) throw new Error(upErr.message);

    await db.from("audit_log").insert({
      admin_user_id: "00000000-0000-0000-0000-000000000000", action: "member_cancelled_subscription",
      details: { user_id: user.id, plan: sub.plan, source: sub.source, processor_confirmed: processorConfirmed, note: processorNote || null },
    }).then(() => {}, () => {});

    if (!processorConfirmed) {
      // Someone must stop the renewal in the CCBill Admin Portal today, or refund it if it renews.
      await db.from("error_logs").insert({
        user_id: user.id,
        error_message: `MANUAL CANCEL NEEDED in CCBill: subscription ${sub.ccbill_subscription_id ?? "(none)"} for user ${user.id}. ${processorNote}`,
        page_url: "edge:cancel-subscription",
      }).then(() => {}, () => {});
    }

    const until = accessUntil
      ? new Date(accessUntil).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" })
      : undefined;
    if (user.email) {
      await sendLoggedTemplateEmail(db, "subscription-cancelled", user.email, {
        templateData: { plan: PLAN_NAMES[sub.plan] ?? "Positive Thots", accessUntil: until },
        idempotencyKey: `cancel-${user.id}-${sub.ccbill_subscription_id ?? sub.id}`,
        callerId: user.id,
      }).catch((e) => console.error("[cancel-subscription] email failed", e));
    }

    return reply(200, { cancelled: true, access_until: accessUntil });
  } catch (e) {
    console.error("[cancel-subscription]", e);
    await db.from("error_logs").insert({
      error_message: `cancel-subscription: ${e instanceof Error ? e.message : String(e)}`, page_url: "edge:cancel-subscription",
    }).then(() => {}, () => {});
    return reply(500, { error: "unexpected" });
  }
});
