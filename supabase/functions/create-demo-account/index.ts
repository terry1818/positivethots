import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const adminUserId = claimsData.claims.sub as string;

    // Use service role client for admin operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify admin role
    const { data: adminRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    // ─── DELETE DEMO ACCOUNT ───
    if (action === "delete") {
      const { userId } = body;
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "userId is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { error: deleteError } =
        await adminClient.auth.admin.deleteUser(userId);
      if (deleteError) {
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Log action
      await adminClient.from("audit_log").insert({
        admin_user_id: adminUserId,
        action: "delete_demo_account",
        target_user_id: userId,
        details: { purpose: "cleanup" },
      });

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ─── CREATE DEMO ACCOUNT ───
    const {
      email = "demo@positivethots.app",
      password,
      displayName = "Demo User",
    } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create auth user with email confirmed
    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = newUser.user.id;

    // Create/update profile
    await adminClient.from("profiles").upsert(
      {
        id: userId,
        name: displayName,
        display_name: displayName,
        onboarding_completed: true,
        gender: "non-binary",
        pronouns: "they/them",
        sexuality: "pansexual",
        relationship_style: "polyamorous",
        relationship_status: "partnered",
        bio: "Demo account for compliance review. This is a test profile showcasing the full Positive Thots experience — education-gated dating for the ENM community.",
        interests: ["communication", "consent", "education", "community"],
        age: 30,
        location: "Columbus, OH",
        is_verified: true,
        experience_level: "experienced",
      },
      { onConflict: "id" }
    );

    // Grant VIP subscription
    await adminClient.from("subscriptions").upsert(
      {
        user_id: userId,
        status: "active",
        plan: "vip",
        current_period_end: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    // Get foundation modules and create badges + learning stats
    const { data: foundationModules } = await adminClient
      .from("education_modules")
      .select("id")
      .eq("tier", "foundation");

    if (foundationModules && foundationModules.length > 0) {
      // Insert badges for each foundation module
      const badges = foundationModules.map((m) => ({
        user_id: userId,
        module_id: m.id,
        quiz_score: 100,
        attempt_count: 1,
        last_attempt_at: new Date().toISOString(),
      }));

      await adminClient.from("user_badges").upsert(badges, {
        onConflict: "user_id,module_id",
      });

      // Get sections for these modules to mark progress
      const moduleIds = foundationModules.map((m) => m.id);
      const { data: sections } = await adminClient
        .from("module_sections")
        .select("id, module_id")
        .in("module_id", moduleIds);

      if (sections && sections.length > 0) {
        const sectionProgress = sections.map((s) => ({
          user_id: userId,
          section_id: s.id,
          completed: true,
          time_spent_seconds: 300,
          last_accessed: new Date().toISOString(),
        }));

        await adminClient
          .from("user_section_progress")
          .upsert(sectionProgress, { onConflict: "user_id,section_id" });
      }
    }

    // Create learning stats
    await adminClient.from("user_learning_stats").upsert(
      {
        user_id: userId,
        total_xp: 500,
        current_level: 2,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: new Date().toISOString().split("T")[0],
      },
      { onConflict: "user_id" }
    );

    // Log admin action
    await adminClient.from("audit_log").insert({
      admin_user_id: adminUserId,
      action: "create_demo_account",
      target_user_id: userId,
      details: { email, display_name: displayName, purpose: "compliance_review" },
    });

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        email,
        message: "Demo account created successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
