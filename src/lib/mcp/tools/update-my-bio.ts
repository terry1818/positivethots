import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_my_bio",
  title: "Update my bio",
  description:
    "Update the About Me text on the signed-in user's Positive Thots profile. Overwrites the existing bio.",
  inputSchema: {
    bio: z
      .string()
      .trim()
      .describe("The new About Me text. Keep it warm, inclusive, and under 500 characters."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ bio }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    if (bio.length === 0) {
      return { content: [{ type: "text", text: "Bio cannot be empty." }], isError: true };
    }
    if (bio.length > 500) {
      return {
        content: [{ type: "text", text: "Bio is too long — keep it under 500 characters." }],
        isError: true,
      };
    }

    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("profiles")
      .update({ bio })
      .eq("id", ctx.getUserId())
      .select("bio")
      .maybeSingle();

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    return {
      content: [{ type: "text", text: `Bio updated: ${data?.bio ?? bio}` }],
      structuredContent: { bio: data?.bio ?? bio },
    };
  },
});
