import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only allow service_role to call this function (server-to-server only)
    const callerRole = (claimsData.claims as Record<string, unknown>).role;
    if (callerRole !== "service_role") {
      return new Response(JSON.stringify({ error: "Forbidden: service role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, type, data } = await req.json();
    if (!user_id || !type) throw new Error("user_id and type are required");

    // Get user's device tokens
    const { data: tokens, error: tokErr } = await supabaseAdmin
      .from("device_tokens")
      .select("token, platform")
      .eq("user_id", user_id);

    if (tokErr) throw tokErr;
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "no_tokens" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build notification content based on type
    let title = "Positive Thots";
    let body = "You have a new notification";

    switch (type) {
      case "new_match":
        title = "New Match! 💜";
        body = data?.name ? `You matched with ${data.name}!` : "You have a new match!";
        break;
      case "new_message":
        title = "New Message 💬";
        body = data?.preview || "Someone sent you a message";
        break;
      case "super_like":
        title = "You got a Thot! ⭐";
        body = "Someone sent you a Thot!";
        break;
      case "boost_expired":
        title = "Boost Expired";
        body = "Your profile boost has ended. Check your results!";
        break;
    }

    // Note: Actual push delivery requires FCM (Android) / APNs (iOS) credentials.
    // This function stores the notification intent. Connect FCM/APNs to deliver.
    // For now, log the notification for future delivery integration.
    console.log(`Push notification: ${title} - ${body} to ${tokens.length} device(s)`);

    return new Response(
      JSON.stringify({ sent: tokens.length, title, body }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
