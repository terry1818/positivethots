// Returns a CCBill hosted payment form (FlexForm) address for one product.
// The app opens that address; the card is entered on CCBill's page, never in the app.
// Access is granted later by ccbill-webhook, never here.
//
// Body: { product: string }  where product is a key in CATALOG, "coins:<coin_packages.id>" or "event:<events.id>".
// Secrets: CCBILL_SUBACC, CCBILL_FLEXFORM_ID, CCBILL_SALT. Until they exist this returns 503 payments_not_configured.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";
import {
  CATALOG, COIN_PREFIX, EVENT_PREFIX, ONE_TIME_PERIOD_DAYS, buildFlexFormUrl, type CheckoutInput,
} from "../_shared/ccbill-core.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const reply = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const subacc = Deno.env.get("CCBILL_SUBACC");
  const flexformId = Deno.env.get("CCBILL_FLEXFORM_ID");
  const salt = Deno.env.get("CCBILL_SALT");
  if (!subacc || !flexformId || !salt) return reply(503, { error: "payments_not_configured" });

  const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
    auth: { persistSession: false },
  });

  try {
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: auth } = await admin.auth.getUser(token);
    const user = auth?.user;
    if (!user) return reply(401, { error: "not_signed_in" });

    const { product } = await req.json().catch(() => ({}));
    if (typeof product !== "string" || product.length > 80) return reply(400, { error: "invalid_product" });

    let input: CheckoutInput;
    const base = { productKey: product, userId: user.id, email: user.email ?? undefined };

    if (product in CATALOG) {
      const p = CATALOG[product];
      if (p.kind === "subscription") {
        const { data: current } = await admin.from("subscriptions")
          .select("status, ccbill_subscription_id, current_period_end").eq("user_id", user.id).maybeSingle();
        const live = current?.status === "active" && current.ccbill_subscription_id &&
          (!current.current_period_end || new Date(current.current_period_end) > new Date());
        // One paid plan at a time. Changing plans: cancel, then subscribe again when the period ends.
        if (live) return reply(409, { error: "already_subscribed" });
        input = { ...base, price: p.price, periodDays: p.periodDays, recurring: true };
      } else {
        input = { ...base, price: p.price, periodDays: ONE_TIME_PERIOD_DAYS, recurring: false };
      }
    } else if (product.startsWith(COIN_PREFIX)) {
      const id = product.slice(COIN_PREFIX.length);
      if (!UUID.test(id)) return reply(400, { error: "invalid_product" });
      const { data: pkg } = await admin.from("coin_packages").select("id, price_usd, is_active").eq("id", id).maybeSingle();
      if (!pkg?.is_active || !(Number(pkg.price_usd) > 0)) return reply(400, { error: "invalid_product" });
      input = { ...base, price: Number(pkg.price_usd), periodDays: ONE_TIME_PERIOD_DAYS, recurring: false, referenceId: pkg.id };
    } else if (product.startsWith(EVENT_PREFIX)) {
      const id = product.slice(EVENT_PREFIX.length);
      if (!UUID.test(id)) return reply(400, { error: "invalid_product" });
      const { data: ev } = await admin.from("events").select("id, price_cents, is_active, event_date").eq("id", id).maybeSingle();
      if (!ev?.is_active || !(ev.price_cents > 0) || new Date(ev.event_date) < new Date()) return reply(400, { error: "invalid_product" });
      const { count } = await admin.from("event_registrations").select("id", { count: "exact", head: true })
        .eq("event_id", id).eq("user_id", user.id);
      if (count) return reply(409, { error: "already_registered" });
      input = { ...base, price: ev.price_cents / 100, periodDays: ONE_TIME_PERIOD_DAYS, recurring: false, referenceId: ev.id };
    } else {
      return reply(400, { error: "invalid_product" });
    }

    await admin.from("analytics_events").insert({
      user_id: user.id, event_name: "checkout_started", event_data: { product, price: input.price },
    }).then(() => {}, () => {});

    return reply(200, { url: buildFlexFormUrl({ subacc, flexformId, salt }, input) });
  } catch (e) {
    console.error("[ccbill-checkout]", e);
    await admin.from("error_logs").insert({
      error_message: `ccbill-checkout: ${e instanceof Error ? e.message : String(e)}`, page_url: "edge:ccbill-checkout",
    }).then(() => {}, () => {});
    return reply(500, { error: "unexpected" });
  }
});
