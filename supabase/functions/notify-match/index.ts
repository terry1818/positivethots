import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";
import {
  buildSafePayload,
  getShowPreviewsPref,
  withinDailyLimit,
} from "../_shared/notification-privacy.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { user1_id, user2_id } = await req.json();
    if (!user1_id || !user2_id) throw new Error("user1_id and user2_id are required");

    const [{ data: p1 }, { data: p2 }] = await Promise.all([
      supabaseAdmin.from("profiles").select("name").eq("id", user1_id).single(),
      supabaseAdmin.from("profiles").select("name").eq("id", user2_id).single(),
    ]);

    const sendPush = async (userId: string, otherName: string) => {
      const { data: tokens } = await supabaseAdmin
        .from("device_tokens")
        .select("token, platform")
        .eq("user_id", userId);
      if (!tokens || tokens.length === 0) return { sent: 0 };

      const allowed = await withinDailyLimit(supabaseAdmin, userId, "new_match");
      if (!allowed) return { sent: 0, reason: "daily_limit" };

      const showPreviews = await getShowPreviewsPref(supabaseAdmin, userId);
      const payload = buildSafePayload(
        "new_match",
        `${otherName} said yes! Start a conversation.`,
        showPreviews,
        { fullTitle: "You Both Said Yes! 💜" }
      );

      console.log(
        `Push new_match → ${userId} previews=${showPreviews ? "on" : "off"}\n` +
          `  lock: ${payload.lockScreenTitle} — ${payload.lockScreenBody}\n` +
          `  full: ${payload.fullTitle} — ${payload.fullBody}`
      );

      await supabaseAdmin.from("analytics_events").insert({
        user_id: userId,
        event_name: "push_notification_sent",
        event_data: { type: "new_match", previews: showPreviews },
      });

      return { sent: tokens.length };
    };

    const [r1, r2] = await Promise.all([
      sendPush(user1_id, p2?.name || "Someone"),
      sendPush(user2_id, p1?.name || "Someone"),
    ]);

    return new Response(JSON.stringify({ user1_sent: r1.sent, user2_sent: r2.sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
