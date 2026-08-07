import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "list_courses",
  title: "List courses",
  description:
    "List the education courses (badge modules) available in Positive Thots, optionally filtered by tier.",
  inputSchema: {
    tier: z
      .string()
      .trim()
      .nullable()
      .describe("Optional tier filter, e.g. 'foundation' or 'advanced'. Null for all tiers."),
    limit: z.number().int().nullable().describe("Max courses to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ tier, limit }) => {
    const supabase = supabaseAnon();
    let query = supabase
      .from("education_modules")
      .select("slug, title, description, tier, badge_number, order_index, estimated_minutes, is_required")
      .order("order_index", { ascending: true })
      .limit(Math.min(Math.max(limit ?? 50, 1), 100));

    if (tier) query = query.eq("tier", tier);

    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { courses: data ?? [] },
    };
  },
});
