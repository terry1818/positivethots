import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const REWARD_MAP: Record<number, { type: string; superLikes?: number; boost?: boolean }> = {
  7: { type: "streak_reward_7", superLikes: 1 },
  30: { type: "streak_reward_30", boost: true },
  100: { type: "streak_reward_100", superLikes: 3 },
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { streak } = await req.json();
    if (!streak || !REWARD_MAP[streak]) {
      return new Response(JSON.stringify({ reward: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reward = REWARD_MAP[streak];
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Idempotency: check xp_transactions for this reward source
    const { data: existing } = await adminClient
      .from("xp_transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("source", reward.type)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ reward: "already_granted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record the reward grant as an xp_transaction (0 XP, just for tracking)
    await adminClient.from("xp_transactions").insert({
      user_id: user.id,
      xp_amount: 0,
      source: reward.type,
      source_id: `streak_${streak}`,
    });

    // Grant super likes
    if (reward.superLikes) {
      const { data: balanceRow } = await adminClient
        .from("super_like_balance")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (balanceRow) {
        await adminClient
          .from("super_like_balance")
          .update({ balance: balanceRow.balance + reward.superLikes, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
      } else {
        await adminClient
          .from("super_like_balance")
          .insert({ user_id: user.id, balance: reward.superLikes });
      }
    }

    // Grant profile boost
    if (reward.boost) {
      await adminClient.from("profile_boosts").insert({ user_id: user.id });
    }

    return new Response(JSON.stringify({ reward: reward.type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("grant-streak-reward error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
