import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { rateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { limited } = rateLimit(req, 5);
  if (limited) return rateLimitResponse(corsHeaders);

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { price_id } = await req.json();
    if (!price_id) throw new Error("price_id is required");

    const ALLOWED_PRICES = new Set([
      "price_1TDkQ9AEIVQtquY2C4kfHe4d",
      "price_1TDjjHQL8g2unk5Zfe9VvytG",
      "price_1TDkQpAEIVQtquY2s6feqEgV",
    ]);
    if (!ALLOWED_PRICES.has(price_id)) throw new Error("Invalid price_id");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Payment system not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: price_id, quantity: 1 }],
      mode: "subscription",
      success_url: (() => {
        const ALLOWED_ORIGINS = ["https://positivethots.lovable.app", "https://positivethots.app", "http://localhost:5173", "http://localhost:8080"];
        const raw = req.headers.get("origin");
        const safe = raw && ALLOWED_ORIGINS.includes(raw) ? raw : "https://positivethots.lovable.app";
        return `${safe}/likes?success=true`;
      })(),
      cancel_url: (() => {
        const ALLOWED_ORIGINS = ["https://positivethots.lovable.app", "https://positivethots.app", "http://localhost:5173", "http://localhost:8080"];
        const raw = req.headers.get("origin");
        const safe = raw && ALLOWED_ORIGINS.includes(raw) ? raw : "https://positivethots.lovable.app";
        return `${safe}/premium`;
      })(),
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[create-checkout] error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    const isUserError = msg === "User not authenticated or email not available" || msg === "price_id is required" || msg === "Invalid price_id";
    return new Response(JSON.stringify({ error: isUserError ? msg : "An unexpected error occurred. Please try again." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: isUserError ? 400 : 500,
    });
  }
});
