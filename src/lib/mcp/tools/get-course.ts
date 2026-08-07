import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "get_course",
  title: "Get course",
  description:
    "Get the full details and lesson content of a single Positive Thots education course by its slug.",
  inputSchema: {
    slug: z.string().trim().describe("The course slug, e.g. 'consent-basics'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }) => {
    const supabase = supabaseAnon();
    const { data, error } = await supabase
      .from("education_modules")
      .select(
        "slug, title, description, tier, badge_number, estimated_minutes, is_required, prerequisite_badges, content, video_url",
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    if (!data) {
      return {
        content: [{ type: "text", text: `No course found with slug "${slug}".` }],
        isError: true,
      };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { course: data },
    };
  },
});
