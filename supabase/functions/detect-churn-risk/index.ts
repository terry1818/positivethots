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

    const now = new Date();
    const day3 = new Date(now); day3.setDate(day3.getDate() - 3);
    const day7 = new Date(now); day7.setDate(day7.getDate() - 7);
    const day14 = new Date(now); day14.setDate(day14.getDate() - 14);
    const day21 = new Date(now); day21.setDate(day21.getDate() - 21);
    const cooldown3d = new Date(now); cooldown3d.setDate(cooldown3d.getDate() - 3);

    // Step 1: Update churn_status for all users based on last_active_at
    // Active: active within 3 days
    await supabaseAdmin
      .from("profiles")
      .update({ churn_status: "active" })
      .gt("last_active_at", day3.toISOString())
      .eq("onboarding_completed", true);

    // At risk: 3-7 days inactive
    await supabaseAdmin
      .from("profiles")
      .update({ churn_status: "at_risk" })
      .lte("last_active_at", day3.toISOString())
      .gt("last_active_at", day7.toISOString())
      .eq("onboarding_completed", true);

    // Inactive: 7-14 days
    await supabaseAdmin
      .from("profiles")
      .update({ churn_status: "inactive" })
      .lte("last_active_at", day7.toISOString())
      .gt("last_active_at", day14.toISOString())
      .eq("onboarding_completed", true);

    // Churned: 14+ days
    await supabaseAdmin
      .from("profiles")
      .update({ churn_status: "churned" })
      .lte("last_active_at", day14.toISOString())
      .eq("onboarding_completed", true);

    // Step 2: Send notifications per tier (with rate limiting)
    const stats = { streak_risk: 0, inactive_push: 0, churned_email: 0, winback_email: 0 };

    // --- Day 3: Streak risk push (only if streak > 7) ---
    const { data: streakRisk } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("churn_status", "at_risk")
      .eq("onboarding_completed", true);

    if (streakRisk) {
      for (const profile of streakRisk) {
        // Check streak and notification cooldown
        const { data: stats_row } = await supabaseAdmin
          .from("user_learning_stats")
          .select("current_streak, streak_freezes")
          .eq("user_id", profile.id)
          .maybeSingle();

        if (!stats_row || stats_row.current_streak <= 7) continue;

        // Check last notification was > 3 days ago
        const { data: lastNotif } = await supabaseAdmin
          .from("analytics_events")
          .select("created_at")
          .eq("user_id", profile.id)
          .eq("event_name", "reengagement_sent")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastNotif && new Date(lastNotif.created_at) > cooldown3d) continue;

        // Check winback_attempts < 3
        const { data: prof } = await supabaseAdmin
          .from("profiles")
          .select("winback_attempts")
          .eq("id", profile.id)
          .maybeSingle();
        if (prof && prof.winback_attempts >= 3) continue;

        // Send push
        const { data: tokens } = await supabaseAdmin
          .from("device_tokens")
          .select("token, platform")
          .eq("user_id", profile.id);

        if (tokens && tokens.length > 0) {
          const freezeMsg = stats_row.streak_freezes > 0
            ? ` You have ${stats_row.streak_freezes} streak freeze${stats_row.streak_freezes !== 1 ? "s" : ""} available.`
            : "";
          console.log(`Push streak-risk: ${profile.id} - ${stats_row.current_streak} day streak.${freezeMsg}`);
          
          await supabaseAdmin.from("analytics_events").insert({
            user_id: profile.id,
            event_name: "reengagement_sent",
            event_data: { type: "streak_risk", streak: stats_row.current_streak },
          });
          await supabaseAdmin
            .from("profiles")
            .update({ winback_attempts: (prof?.winback_attempts || 0) + 1 })
            .eq("id", profile.id);
          stats.streak_risk++;
        }
      }
    }

    // --- Day 7: Inactive push with match count ---
    const { data: inactiveUsers } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("churn_status", "inactive")
      .eq("onboarding_completed", true);

    if (inactiveUsers) {
      for (const profile of inactiveUsers) {
        const { data: lastNotif } = await supabaseAdmin
          .from("analytics_events")
          .select("created_at")
          .eq("user_id", profile.id)
          .eq("event_name", "reengagement_sent")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (lastNotif && new Date(lastNotif.created_at) > cooldown3d) continue;

        const { data: prof } = await supabaseAdmin
          .from("profiles")
          .select("winback_attempts")
          .eq("id", profile.id)
          .maybeSingle();
        if (prof && prof.winback_attempts >= 3) continue;

        const { data: tokens } = await supabaseAdmin
          .from("device_tokens")
          .select("token, platform")
          .eq("user_id", profile.id);

        if (tokens && tokens.length > 0) {
          // Count recent likes
          const { count: likeCount } = await supabaseAdmin
            .from("swipes")
            .select("id", { count: "exact", head: true })
            .eq("swiped_id", profile.id)
            .eq("direction", "right")
            .gte("created_at", day7.toISOString());

          console.log(`Push inactive: ${profile.id} - ${likeCount || 0} new likes`);
          await supabaseAdmin.from("analytics_events").insert({
            user_id: profile.id,
            event_name: "reengagement_sent",
            event_data: { type: "inactive_push", new_likes: likeCount || 0 },
          });
          await supabaseAdmin
            .from("profiles")
            .update({ winback_attempts: (prof?.winback_attempts || 0) + 1 })
            .eq("id", profile.id);
          stats.inactive_push++;
        }
      }
    }

    // --- Day 14+: Churned email ---
    const { data: churnedUsers } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("churn_status", "churned")
      .eq("onboarding_completed", true)
      .lte("last_active_at", day14.toISOString())
      .gt("last_active_at", day21.toISOString());

    if (churnedUsers) {
      for (const profile of churnedUsers) {
        const { data: lastNotif } = await supabaseAdmin
          .from("analytics_events")
          .select("created_at")
          .eq("user_id", profile.id)
          .eq("event_name", "reengagement_sent")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (lastNotif && new Date(lastNotif.created_at) > cooldown3d) continue;

        const { data: prof } = await supabaseAdmin
          .from("profiles")
          .select("winback_attempts")
          .eq("id", profile.id)
          .maybeSingle();
        if (prof && prof.winback_attempts >= 3) continue;

        // Count new members this week
        const { count: newMembers } = await supabaseAdmin
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", day7.toISOString());

        console.log(`Email churned: ${profile.id} - ${newMembers || 0} new members`);
        await supabaseAdmin.from("analytics_events").insert({
          user_id: profile.id,
          event_name: "reengagement_sent",
          event_data: { type: "churned_email", new_members: newMembers || 0 },
        });
        await supabaseAdmin
          .from("profiles")
          .update({ winback_attempts: (prof?.winback_attempts || 0) + 1 })
          .eq("id", profile.id);
        stats.churned_email++;
      }
    }

    // --- Day 21: Win-back email with XP offer ---
    const { data: winbackUsers } = await supabaseAdmin
      .from("profiles")
      .select("id, last_winback_sent_at, winback_attempts")
      .eq("churn_status", "churned")
      .eq("onboarding_completed", true)
      .lte("last_active_at", day21.toISOString())
      .is("last_winback_sent_at", null);

    if (winbackUsers) {
      for (const profile of winbackUsers) {
        if (profile.winback_attempts >= 3) continue;

        console.log(`Email winback: ${profile.id} - 50 XP offer`);
        await supabaseAdmin.from("analytics_events").insert({
          user_id: profile.id,
          event_name: "reengagement_sent",
          event_data: { type: "winback_email", xp_offer: 50 },
        });
        await supabaseAdmin
          .from("profiles")
          .update({
            last_winback_sent_at: now.toISOString(),
            winback_attempts: profile.winback_attempts + 1,
          })
          .eq("id", profile.id);
        stats.winback_email++;
      }
    }

    return new Response(JSON.stringify({ success: true, stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
