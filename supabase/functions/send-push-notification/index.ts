import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";
import {
  buildSafePayload,
  getShowPreviewsPref,
  withinDailyLimit,
  type NotificationKind,
} from "../_shared/notification-privacy.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const kind = type as NotificationKind;

    // Per-user daily frequency limits (≤2/day general, ≤5/day messages)
    const allowed = await withinDailyLimit(supabaseAdmin, user_id, kind);
    if (!allowed) {
      return new Response(
        JSON.stringify({ sent: 0, reason: "daily_limit_reached" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Branded full content (shown only after unlock / in notification center).
    let fullTitle = "Positive Thots";
    let fullBody = "You have a new notification";

    switch (kind) {
      case "new_match":
        fullTitle = "You Both Said Yes! 💜";
        fullBody = data?.name
          ? `${data.name} said yes! Start a conversation.`
          : "Someone said yes! Start a conversation.";
        break;
      case "new_message":
        fullTitle = data?.senderName ? `${data.senderName}` : "New message";
        fullBody = data?.preview || "You have a new message";
        break;
      case "super_like":
        fullTitle = "You got a Thot! ⭐";
        fullBody = "Someone sent you a Thot! Open the app to see who.";
        break;
      case "badge_earned":
        fullTitle = "Badge earned 💜";
        fullBody = data?.badgeName
          ? `You earned the ${data.badgeName} badge!`
          : "You earned a new badge!";
        break;
      case "boost_expired":
        fullTitle = "Boost ended";
        fullBody = "Your profile boost has ended. Check your results!";
        break;
      case "streak_risk":
      case "streak_critical":
        fullTitle = "Keep your streak alive";
        fullBody = data?.streak
          ? `Your ${data.streak}-day streak ends today. Open a course to keep it going.`
          : "Your streak ends today. Open a course to keep it going.";
        break;
    }

    // Build privacy-safe payload based on the recipient's preference.
    const showPreviews = await getShowPreviewsPref(supabaseAdmin, user_id);
    const payload = buildSafePayload(kind, fullBody, showPreviews, { fullTitle });

    // NOTE: Actual delivery requires FCM (Android) / APNs (iOS) credentials.
    // When wired in, send BOTH versions:
    //   • iOS: alert.title/alert.body = full content; the system applies
    //     the user's "Show Previews" setting. Provide a UNNotificationCategory
    //     with hiddenPreviewsBodyPlaceholder = lockScreenBody so iOS shows
    //     the safe text when previews are hidden.
    //   • Android: build a Notification with setVisibility(VISIBILITY_PRIVATE)
    //     and a public version whose contentTitle/contentText come from
    //     lockScreenTitle/lockScreenBody. Android shows the public version
    //     on the lock screen and the private version after unlock.
    console.log(
      `Push (${kind}) → user=${user_id} devices=${tokens.length} previews=${showPreviews ? "on" : "off"}\n` +
        `  lock: ${payload.lockScreenTitle} — ${payload.lockScreenBody}\n` +
        `  full: ${payload.fullTitle} — ${payload.fullBody}`
    );

    await supabaseAdmin.from("analytics_events").insert({
      user_id,
      event_name: "push_notification_sent",
      event_data: { type: kind, previews: showPreviews },
    });

    return new Response(
      JSON.stringify({
        sent: tokens.length,
        previews_enabled: showPreviews,
        lock_screen: { title: payload.lockScreenTitle, body: payload.lockScreenBody },
        full: { title: payload.fullTitle, body: payload.fullBody },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
