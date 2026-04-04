import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const LEAGUE_ORDER = ["bronze", "silver", "gold", "diamond", "champion"];

    // 1. Close active sprints
    const { data: activeSprints } = await supabase
      .from("weekly_sprints")
      .select("*")
      .eq("is_active", true);

    for (const sprint of activeSprints ?? []) {
      // Calculate final ranks
      const { data: participants } = await supabase
        .from("sprint_participants")
        .select("*")
        .eq("sprint_id", sprint.id)
        .order("xp_earned", { ascending: false });

      if (!participants || participants.length === 0) continue;

      const total = participants.length;
      const promoCount = Math.min(5, Math.floor(total * 0.2));
      const demoCount = Math.min(5, Math.floor(total * 0.2));

      for (let i = 0; i < participants.length; i++) {
        const rank = i + 1;
        const isPromo = rank <= promoCount;
        const isDemo = rank > total - demoCount;

        await supabase
          .from("sprint_participants")
          .update({
            rank,
            promotion_zone: isPromo,
            demotion_zone: isDemo,
            updated_at: new Date().toISOString(),
          })
          .eq("id", participants[i].id);
      }

      // Deactivate sprint
      await supabase
        .from("weekly_sprints")
        .update({ is_active: false })
        .eq("id", sprint.id);
    }

    // 2. Create new sprints for each tier
    const today = new Date();
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() - today.getUTCDay() + 1);
    monday.setUTCHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);

    const weekStart = monday.toISOString().split("T")[0];
    const weekEnd = sunday.toISOString().split("T")[0];

    for (const tier of LEAGUE_ORDER) {
      await supabase.from("weekly_sprints").upsert({
        week_start: weekStart,
        week_end: weekEnd,
        league_tier: tier,
        is_active: true,
        max_participants: 30,
      }, { onConflict: "week_start,league_tier" });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
