import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "my_learning_progress",
  title: "My learning progress",
  description:
    "Get the signed-in user's Positive Thots learning progress: earned badges, learning level, and quiz scores.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }

    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const [profileResult, badgesResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, learning_level")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("user_badges")
        .select("earned_at, quiz_score, module_id, education_modules(slug, title, tier)")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false }),
    ]);

    const error = profileResult.error ?? badgesResult.error;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    const badges = badgesResult.data ?? [];
    const summary = {
      display_name: profileResult.data?.display_name ?? null,
      learning_level: profileResult.data?.learning_level ?? null,
      badges_earned: badges.length,
      badges,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(summary) }],
      structuredContent: summary,
    };
  },
});
