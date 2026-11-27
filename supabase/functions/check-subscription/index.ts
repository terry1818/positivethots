// Reports the signed-in member's plan from the subscriptions table, which ccbill-webhook keeps current.
// (It used to ask Stripe; Stripe is closed.)
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const reply = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
    auth: { persistSession: false },
  });
  try {
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: auth } = await db.auth.getUser(token);
    if (!auth?.user) return reply({ subscribed: false, fallback: true });

    const { data: sub } = await db.from("subscriptions")
      .select("plan, status, current_period_end, cancel_at_period_end, billing_period, source")
      .eq("user_id", auth.user.id).maybeSingle();
    const live = sub?.status === "active" && (!sub.current_period_end || new Date(sub.current_period_end) > new Date());
    return reply({
      subscribed: !!live,
      plan: live ? sub!.plan : null,
      subscription_end: live ? sub!.current_period_end : null,
      cancel_at_period_end: live ? !!sub!.cancel_at_period_end : false,
      billing_period: live ? sub!.billing_period : null,
      source: live ? sub!.source : null,
    });
  } catch (e) {
    console.error("[check-subscription]", e);
    return reply({ error: "unexpected" }, 500);
  }
});
