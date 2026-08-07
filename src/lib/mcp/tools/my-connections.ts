import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "my_connections",
  title: "My connections",
  description:
    "List the signed-in user's connections (people they and the other person both said yes to) in Positive Thots.",
  inputSchema: {
    limit: z.number().int().nullable().describe("Max connections to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }

    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const { data, error } = await supabase
      .from("matches")
      .select("id, created_at, user1_id, user2_id")
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 25, 1), 100));

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    const rows = data ?? [];
    const otherIds = rows.map((row) => (row.user1_id === userId ? row.user2_id : row.user1_id));

    let names = new Map<string, string | null>();
    if (otherIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, name")
        .in("id", otherIds);
      names = new Map(
        (profiles ?? []).map((p: { id: string; display_name: string | null; name?: string | null }) => [
          p.id,
          p.display_name ?? p.name ?? null,
        ]),
      );
    }

    const connections = rows.map((row) => {
      const otherId = row.user1_id === userId ? row.user2_id : row.user1_id;
      return {
        match_id: row.id,
        connected_at: row.created_at,
        name: names.get(otherId) ?? "Someone",
      };
    });

    return {
      content: [{ type: "text", text: JSON.stringify(connections) }],
      structuredContent: { connections },
    };
  },
});
