import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[REDEEM-PROMO] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("Unauthorized");
    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    const { code } = await req.json();
    if (!code || typeof code !== "string") throw new Error("Code is required");
    const normalizedCode = code.trim().toUpperCase();

    // Look up promo code
    const { data: promoCode, error: codeError } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", normalizedCode)
      .maybeSingle();

    if (codeError) throw codeError;
    if (!promoCode) throw new Error("Invalid promo code");
    if (promoCode.redeemed_by) throw new Error("This code has already been used");

    // Prevent self-redemption
    if (promoCode.created_by === user.id) {
      throw new Error("You cannot redeem your own code");
    }

    // Check if user already redeemed a promo code
    const { count } = await supabase
      .from("promo_codes")
      .select("id", { count: "exact", head: true })
      .eq("redeemed_by", user.id);

    if (count && count > 0) {
      throw new Error("You have already redeemed a promo code");
    }

    // Codes give free access straight away. No card and no checkout (the old Stripe trial checkout is gone).
    const plan: string = promoCode.type === "gift" ? (promoCode.tier || "premium") : "premium";
    if (!["plus", "premium", "vip"].includes(plan)) throw new Error("Invalid tier");
    const trialDays: number = promoCode.trial_days || (promoCode.type === "gift" ? 14 : 14);

    const { data: current } = await supabase.from("subscriptions")
      .select("status, current_period_end, source").eq("user_id", user.id).maybeSingle();
    const live = current?.status === "active" && (!current.current_period_end || new Date(current.current_period_end) > new Date());
    if (live) {
      return new Response(JSON.stringify({ error: "You already have a plan. Save this code for later." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Atomically mark the code as redeemed first, so two taps can't both win.
    const { error: updateError, data: updateResult } = await supabase
      .from("promo_codes")
      .update({ redeemed_by: user.id, redeemed_at: new Date().toISOString() })
      .eq("id", promoCode.id)
      .is("redeemed_by", null)
      .select();
    if (updateError || !updateResult || updateResult.length === 0) {
      return new Response(JSON.stringify({ error: "This promo code has already been redeemed" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const until = new Date(Date.now() + trialDays * 86_400_000).toISOString();
    const { error: grantError } = await supabase.from("subscriptions").upsert({
      user_id: user.id, plan, status: "active", source: "promo", current_period_end: until,
      ccbill_subscription_id: null, billing_period: null, cancel_at_period_end: true,
      cancelled_at: null, cancel_requested_at: null, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (grantError) {
      // Give the code back so the member can try again.
      await supabase.from("promo_codes").update({ redeemed_by: null, redeemed_at: null }).eq("id", promoCode.id);
      throw new Error("Could not start your plan");
    }

    logStep("Code redeemed", { plan, trialDays });
    return new Response(JSON.stringify({ granted: true, plan, until }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
