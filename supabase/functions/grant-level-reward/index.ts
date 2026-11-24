import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth client to get the calling user
    const authClient = createClient(supabaseUrl, serviceKey);
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { level } = await req.json();
    if (typeof level !== "number" || level < 1) {
      return new Response(JSON.stringify({ error: "Invalid level" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const rewards: string[] = [];

    // The level comes from the member's own record, not from what the app says it is.
    const { data: learning } = await admin
      .from("user_learning_stats")
      .select("current_level, streak_freezes")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!learning || level > (learning.current_level ?? 1)) {
      return new Response(JSON.stringify({ error: "Level not reached" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Define level rewards
    const levelRewards: Record<number, () => Promise<void>> = {
      3: async () => {
        // +1 Super Like
        const { data: balance } = await admin
          .from("super_like_balance")
          .select("balance")
          .eq("user_id", user.id)
          .maybeSingle();

        if (balance) {
          await admin
            .from("super_like_balance")
            .update({ balance: balance.balance + 1, updated_at: new Date().toISOString() })
            .eq("user_id", user.id);
        } else {
          await admin
            .from("super_like_balance")
            .insert({ user_id: user.id, balance: 1 });
        }
        rewards.push("+1 Thot");
      },
      5: async () => {
        // +1 streak freeze, the kind award_xp spends when a day is missed (at most 3 held).
        // level_reward_5_freeze marks it as given, so the catch-up in the migration never doubles it.
        await admin
          .from("user_learning_stats")
          .update({
            streak_freezes: Math.min((learning.streak_freezes ?? 0) + 1, 3),
            streak_freeze_available: true,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
        await admin.from("xp_transactions").insert({
          user_id: user.id, xp_amount: 0, source: "level_reward_5_freeze", source_id: "level_5",
        });
        rewards.push("+1 Streak Freeze");
      },
      7: async () => {
        // +2 Super Likes
        const { data: balance } = await admin
          .from("super_like_balance")
          .select("balance")
          .eq("user_id", user.id)
          .maybeSingle();

        if (balance) {
          await admin
            .from("super_like_balance")
            .update({ balance: balance.balance + 2, updated_at: new Date().toISOString() })
            .eq("user_id", user.id);
        } else {
          await admin
            .from("super_like_balance")
            .insert({ user_id: user.id, balance: 2 });
        }
        rewards.push("+2 Thots");
      },
      10: async () => {
        // +1 boost credit
        const { data: stats } = await admin
          .from("user_learning_stats")
          .select("boost_credits")
          .eq("user_id", user.id)
          .maybeSingle();

        const current = (stats as any)?.boost_credits ?? 0;
        await admin
          .from("user_learning_stats")
          .update({ boost_credits: current + 1, updated_at: new Date().toISOString() } as any)
          .eq("user_id", user.id);
        rewards.push("+1 Profile Boost credit");
      },
    };

    const rewardFn = levelRewards[level];
    if (!rewardFn) {
      return new Response(JSON.stringify({ rewards: [], message: "No reward for this level" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency check: see if we already granted this level reward
    const sourceKey = `level_reward_${level}`;
    const { data: existing } = await admin
      .from("xp_transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("source", sourceKey)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ rewards: [], message: "Reward already granted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Grant the reward
    await rewardFn();

    // Record the grant for idempotency (0 XP transaction as a marker)
    await admin.from("xp_transactions").insert({
      user_id: user.id,
      xp_amount: 0,
      source: sourceKey,
      source_id: `level_${level}`,
    });

    return new Response(JSON.stringify({ rewards }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("grant-level-reward error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
