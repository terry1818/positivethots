import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const TIER_PRICE_MAP: Record<string, string> = {
  plus: "price_1TDkQ9AEIVQtquY2C4kfHe4d",
  premium: "price_1TDjjHQL8g2unk5Zfe9VvytG",
  vip: "price_1TDkQpAEIVQtquY2s6feqEgV",
};

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

    // Determine tier and trial days
    let priceId: string;
    let trialDays: number = promoCode.trial_days;

    if (promoCode.type === "gift") {
      const tier = promoCode.tier || "premium";
      priceId = TIER_PRICE_MAP[tier];
      if (!priceId) throw new Error("Invalid tier");
    } else {
      // Referral codes default to Premium with 14-day trial
      priceId = TIER_PRICE_MAP["premium"];
      trialDays = trialDays || 14;
    }

    // Create Stripe checkout with trial
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Server misconfigured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find or reference Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://positivethots.lovable.app";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      subscription_data: {
        trial_period_days: trialDays,
        metadata: { promo_code_id: promoCode.id },
      },
      success_url: `${origin}/premium?redeemed=true`,
      cancel_url: `${origin}/premium`,
      metadata: { promo_code_id: promoCode.id, user_id: user.id },
    });

    // Mark code as redeemed
    const { error: updateError } = await supabase
      .from("promo_codes")
      .update({
        redeemed_by: user.id,
        redeemed_at: new Date().toISOString(),
      })
      .eq("id", promoCode.id)
      .is("redeemed_by", null);

    if (updateError) {
      logStep("Error marking code redeemed", { error: updateError.message });
    }

    logStep("Checkout session created", { sessionId: session.id, trialDays });
    return new Response(JSON.stringify({ url: session.url }), {
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
