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
    if (!user?.email) throw new Error("User not authenticated");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const { pack_size } = await req.json().catch(() => ({ pack_size: 10 }));

    const PACK_PRICES: Record<number, string> = {
      5: "price_1TOGT3AEIVQtquY2Zxm1pWeN",
      10: "price_1TDkaqAEIVQtquY2l8yO6Xf3",
    };

    const priceId = PACK_PRICES[pack_size] ?? PACK_PRICES[10];

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/?superlikes=purchased`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: { user_id: user.id, type: "super_like_pack", pack_size: String(pack_size) },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[create-superlike-payment] error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    const isUserError = msg === "User not authenticated";
    return new Response(JSON.stringify({ error: isUserError ? msg : "An unexpected error occurred. Please try again." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: isUserError ? 400 : 500,
    });
  }
});
