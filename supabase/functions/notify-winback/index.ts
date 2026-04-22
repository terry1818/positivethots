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

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const targetDate = sevenDaysAgo.toISOString().split("T")[0];

    const { data: inactiveUsers, error } = await supabaseAdmin
      .from("user_learning_stats")
      .select("user_id")
      .eq("last_activity_date", targetDate);

    if (error) throw error;
    if (!inactiveUsers || inactiveUsers.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "no_inactive_users" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;
    for (const user of inactiveUsers) {
      const { data: tokens } = await supabaseAdmin
        .from("device_tokens")
        .select("token, platform")
        .eq("user_id", user.user_id);
      if (!tokens || tokens.length === 0) continue;

      const allowed = await withinDailyLimit(supabaseAdmin, user.user_id, "winback");
      if (!allowed) continue;

      const showPreviews = await getShowPreviewsPref(supabaseAdmin, user.user_id);
      const payload = buildSafePayload(
        "winback",
        "We saved your progress. Ready to jump back in? Just one lesson!",
        showPreviews,
        { fullTitle: "It's been a while..." }
      );

      console.log(
        `Push winback → ${user.user_id} previews=${showPreviews ? "on" : "off"}\n` +
          `  lock: ${payload.lockScreenTitle} — ${payload.lockScreenBody}\n` +
          `  full: ${payload.fullTitle} — ${payload.fullBody}`
      );
      sentCount++;

      await supabaseAdmin.from("analytics_events").insert({
        user_id: user.user_id,
        event_name: "push_notification_sent",
        event_data: { type: "winback", previews: showPreviews },
      });
    }

    return new Response(
      JSON.stringify({ sent: sentCount, total_inactive: inactiveUsers.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
