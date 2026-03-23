import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PREMIUM_COUPON_ID = "Eb0bLmYb";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { event_id } = await req.json();
    if (!event_id) throw new Error("event_id is required");

    // Fetch event details
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: event, error: eventErr } = await serviceClient
      .from("events")
      .select("*")
      .eq("id", event_id)
      .eq("is_active", true)
      .single();

    if (eventErr || !event) throw new Error("Event not found or inactive");

    // Check capacity
    const { count } = await serviceClient
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event_id);

    if ((count ?? 0) >= event.capacity) throw new Error("Event is sold out");

    // Check if already registered
    const { data: existing } = await serviceClient
      .from("event_registrations")
      .select("id")
      .eq("event_id", event_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) throw new Error("You are already registered for this event");

    if (!event.stripe_price_id) throw new Error("Event is not configured for payments");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if user is a premium subscriber for discount
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    let isPremiumSubscriber = false;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      isPremiumSubscriber = subs.data.length > 0;
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: event.stripe_price_id, quantity: 1 }],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/events?registered=${event_id}`,
      cancel_url: `${req.headers.get("origin")}/events`,
      metadata: {
        user_id: user.id,
        event_id: event_id,
        type: "event_ticket",
      },
    };

    // Apply 25% discount for premium subscribers
    if (isPremiumSubscriber) {
      sessionParams.discounts = [{ coupon: PREMIUM_COUPON_ID }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[create-event-checkout] error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    const isUserError = ["User not authenticated", "event_id is required", "Event not found or inactive", "Event is sold out", "You are already registered for this event"].includes(msg);
    return new Response(JSON.stringify({ error: isUserError ? msg : "An unexpected error occurred. Please try again." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: isUserError ? 400 : 500,
    });
  }
});
