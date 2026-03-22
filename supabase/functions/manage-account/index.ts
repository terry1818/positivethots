import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { action } = await req.json();

    if (action === "export") {
      // Export user data
      const [
        { data: profile },
        { data: badges },
        { data: photos },
        { data: stats },
        { data: swipes },
        { data: matches },
        { data: messages },
        { data: xpTx },
        { data: challenges },
      ] = await Promise.all([
        supabaseAdmin.from("profiles").select("*").eq("id", user.id).single(),
        supabaseAdmin.from("user_badges").select("*, education_modules(title, slug)").eq("user_id", user.id),
        supabaseAdmin.from("user_photos").select("*").eq("user_id", user.id),
        supabaseAdmin.from("user_learning_stats").select("*").eq("user_id", user.id).single(),
        supabaseAdmin.from("swipes").select("*").eq("swiper_id", user.id),
        supabaseAdmin.from("matches").select("*").or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
        supabaseAdmin.from("messages").select("*").eq("sender_id", user.id),
        supabaseAdmin.from("xp_transactions").select("*").eq("user_id", user.id),
        supabaseAdmin.from("daily_challenges").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        account: { email: user.email, created_at: user.created_at },
        profile,
        photos: photos?.map(p => ({ url: p.photo_url, visibility: p.visibility, status: p.moderation_status })),
        learning: { stats, badges, xp_transactions: xpTx, daily_challenges: challenges },
        social: { swipes_count: swipes?.length || 0, matches_count: matches?.length || 0, messages_sent: messages?.length || 0 },
      };

      return new Response(JSON.stringify(exportData, null, 2), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      // Delete all user data in order (respecting foreign keys)
      const userId = user.id;

      // Get match IDs for message cleanup
      const { data: userMatches } = await supabaseAdmin
        .from("matches")
        .select("id")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
      const matchIds = userMatches?.map(m => m.id) || [];

      // Delete in dependency order
      if (matchIds.length > 0) {
        await supabaseAdmin.from("messages").delete().in("match_id", matchIds);
      }
      
      await Promise.all([
        supabaseAdmin.from("xp_transactions").delete().eq("user_id", userId),
        supabaseAdmin.from("daily_challenges").delete().eq("user_id", userId),
        supabaseAdmin.from("user_section_progress").delete().eq("user_id", userId),
        supabaseAdmin.from("user_badges").delete().eq("user_id", userId),
        supabaseAdmin.from("user_learning_stats").delete().eq("user_id", userId),
        supabaseAdmin.from("user_photos").delete().eq("user_id", userId),
        supabaseAdmin.from("verification_requests").delete().eq("user_id", userId),
        supabaseAdmin.from("linked_profiles").delete().or(`user_id.eq.${userId},partner_id.eq.${userId}`),
        supabaseAdmin.from("user_roles").delete().eq("user_id", userId),
        supabaseAdmin.from("reports").delete().eq("reporter_id", userId),
        supabaseAdmin.from("blocked_users").delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
      ]);

      // Delete swipes and matches
      await supabaseAdmin.from("swipes").delete().or(`swiper_id.eq.${userId},swiped_id.eq.${userId}`);
      await supabaseAdmin.from("matches").delete().or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
      await supabaseAdmin.from("subscriptions").delete().eq("user_id", userId);
      await supabaseAdmin.from("profiles").delete().eq("id", userId);

      // Finally delete the auth user
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action. Use 'export' or 'delete'.");
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
