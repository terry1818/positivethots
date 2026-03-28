import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

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

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Find users whose last activity was yesterday and have an active streak
    const { data: atRiskUsers, error } = await supabaseAdmin
      .from("user_learning_stats")
      .select("user_id, current_streak, streak_freezes")
      .eq("last_activity_date", yesterdayStr)
      .gt("current_streak", 0);

    if (error) throw error;
    if (!atRiskUsers || atRiskUsers.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "no_at_risk_users" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;
    for (const user of atRiskUsers) {
      const { data: tokens } = await supabaseAdmin
        .from("device_tokens")
        .select("token, platform")
        .eq("user_id", user.user_id);

      if (tokens && tokens.length > 0) {
        const freezeMsg = user.streak_freezes > 0
          ? ` You have ${user.streak_freezes} streak freeze${user.streak_freezes !== 1 ? 's' : ''} available.`
          : " You have no streak freezes left!";

        console.log(`Push: Streak risk to ${user.user_id} - ${user.current_streak} day streak.${freezeMsg}`);
        sentCount++;

        await supabaseAdmin.from("analytics_events").insert({
          user_id: user.user_id,
          event_name: "push_notification_sent",
          event_data: {
            type: "streak_risk",
            streak: user.current_streak,
            freezes_available: user.streak_freezes,
          },
        });
      }
    }

    return new Response(JSON.stringify({ sent: sentCount, total_at_risk: atRiskUsers.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
