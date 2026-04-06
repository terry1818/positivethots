import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// Stripe webhook is server-to-server, keep permissive CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_UC8hgE8GHk3Jz2": "plus",
  "prod_TyazHeNgEAjKEg": "premium",
  "prod_UC8igDQOTInDei": "vip",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

function getPlanFromSubscription(subscription: Stripe.Subscription): string {
  const productId = subscription.items.data[0]?.price?.product as string;
  return PRODUCT_TO_PLAN[productId] ?? "premium";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey) {
    logStep("ERROR", { message: "STRIPE_SECRET_KEY not set" });
    return new Response("Server misconfigured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.text();
    let event: Stripe.Event;

    if (!webhookSecret) {
      logStep("ERROR", { message: "STRIPE_WEBHOOK_SECRET not set" });
      return new Response("Server misconfigured: webhook secret missing", { status: 500 });
    }

    const sig = req.headers.get("stripe-signature");
    if (!sig) throw new Error("Missing stripe-signature header");
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    logStep("Webhook signature verified", { type: event.type });

    const relevantEvents = [
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "checkout.session.completed",
      "checkout.session.expired",
    ];

    if (!relevantEvents.includes(event.type)) {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle abandoned checkout (expired session)
    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail = session.customer_details?.email;
      if (customerEmail) {
        const { data: users } = await supabase.auth.admin.listUsers();
        const user = users?.users.find((u) => u.email === customerEmail);
        if (user) {
          await supabase.from("analytics_events").insert({
            user_id: user.id,
            event_name: "checkout_abandoned",
            event_data: {
              price_id: session.metadata?.price_id || null,
              amount: session.amount_total,
            },
          });
          logStep("Checkout abandoned logged", { userId: user.id, email: customerEmail });
        }
      }
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Handle one-time payment completions
      if (session.mode === "payment") {
        await handleOneTimePayment(supabase, session);
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      if (session.mode !== "subscription") {
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const customerEmail = session.customer_details?.email;
      if (!customerEmail) {
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const { data: users, error: userError } = await supabase.auth.admin.listUsers();
      if (userError) throw userError;

      const user = users.users.find((u) => u.email === customerEmail);
      if (!user) {
        logStep("No matching user found", { email: customerEmail });
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const subscriptionId = session.subscription as string;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await upsertSubscription(supabase, user.id, subscription);
      logStep("Checkout processed", { userId: user.id });

      // Process referral reward
      await processReferralReward(supabase, stripe, user.id);
    } else {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const customer = await stripe.customers.retrieve(customerId);

      if ((customer as any).deleted) {
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const email = (customer as Stripe.Customer).email;
      if (!email) {
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users?.users.find((u) => u.email === email);
      if (!user) {
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      await upsertSubscription(supabase, user.id, subscription);
      logStep(`${event.type} processed`, { userId: user.id });

      // Process referral reward on subscription created/updated (active status)
      if (
        (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") &&
        (subscription.status === "active" || subscription.status === "trialing")
      ) {
        await processReferralReward(supabase, stripe, user.id);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
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

async function upsertSubscription(
  supabase: any,
  userId: string,
  subscription: Stripe.Subscription
) {
  const status = subscription.status === "active" || subscription.status === "trialing"
    ? "active"
    : "inactive";

  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  const plan = getPlanFromSubscription(subscription);

  const { error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        status,
        plan,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    logStep("Error upserting subscription", { error: error.message });
    throw error;
  }

  logStep("Subscription upserted", { userId, status, plan, periodEnd });
}

async function processReferralReward(
  supabase: any,
  stripe: Stripe,
  subscribedUserId: string
) {
  try {
    // Check if this user redeemed a referral-type promo code
    const { data: referralCode, error: refError } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("redeemed_by", subscribedUserId)
      .eq("type", "referral")
      .eq("referred_subscribed", false)
      .maybeSingle();

    if (refError || !referralCode) return;

    logStep("Referral detected", { referrer: referralCode.created_by, referred: subscribedUserId });

    // Mark as subscribed
    await supabase
      .from("promo_codes")
      .update({ referred_subscribed: true })
      .eq("id", referralCode.id);

    // Check if reward already granted
    if (referralCode.reward_granted) return;

    // Grant referrer 90-day Premium trial via Stripe
    const referrerId = referralCode.created_by;

    // Get referrer's email
    const { data: referrerData } = await supabase.auth.admin.getUserById(referrerId);
    if (!referrerData?.user?.email) {
      logStep("Referrer not found", { referrerId });
      return;
    }

    const referrerEmail = referrerData.user.email;

    // Find or create Stripe customer for referrer
    const customers = await stripe.customers.list({ email: referrerEmail, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const newCustomer = await stripe.customers.create({ email: referrerEmail });
      customerId = newCustomer.id;
    }

    // Create subscription with 90-day trial for Premium
    const premiumPriceId = "price_1TDjjHQL8g2unk5Zfe9VvytG";
    await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: premiumPriceId }],
      trial_period_days: 90,
      metadata: { referral_reward: "true", referred_user: subscribedUserId },
    });

    // Mark reward as granted
    await supabase
      .from("promo_codes")
      .update({ reward_granted: true })
      .eq("id", referralCode.id);

    logStep("Referral reward granted", { referrerId, trialDays: 90 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("Error processing referral reward", { message: msg });
    // Don't throw — referral reward failure shouldn't fail the webhook
  }
}

async function handleOneTimePayment(supabase: any, session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {};
  const userId = metadata.user_id;
  const type = metadata.type;

  if (!userId) {
    logStep("One-time payment missing user_id metadata", { sessionId: session.id });
    return;
  }

  logStep("Processing one-time payment", { type, userId });

  if (type === "event_ticket") {
    const eventId = metadata.event_id;
    if (!eventId) return;

    const { error } = await supabase.from("event_registrations").insert({
      event_id: eventId,
      user_id: userId,
      stripe_payment_intent_id: session.payment_intent as string,
    });

    if (error) {
      logStep("Error inserting event registration", { error: error.message });
    } else {
      logStep("Event registration created", { userId, eventId });
    }
  } else if (type === "super_like_pack") {
    const packSize = parseInt(metadata.pack_size ?? "10", 10);

    // Track the purchase
    await supabase.from("super_like_purchases").insert({
      user_id: userId,
      pack_size: packSize,
      stripe_payment_intent_id: session.payment_intent as string,
    });

    // Add to user's balance
    const { data: existing } = await supabase
      .from("super_like_balance")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("super_like_balance")
        .update({ balance: existing.balance + packSize, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    } else {
      await supabase
        .from("super_like_balance")
        .insert({ user_id: userId, balance: packSize });
    }

    logStep("Super like pack credited", { userId, packSize });
  } else if (type === "profile_boost") {
    const { error } = await supabase.from("profile_boosts").insert({
      user_id: userId,
    });

    if (error) {
      logStep("Error inserting profile boost", { error: error.message });
    } else {
      logStep("Profile boost activated", { userId });
    }
  }
}
