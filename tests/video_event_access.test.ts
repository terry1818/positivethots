import { expect, test } from "bun:test";

// Evaluate the deployed policies against synthetic records, without saving data.
function query(sql: string): Record<string, unknown>[] {
  const result = Bun.spawnSync(["lovable", "supabase", "query", sql, "--json"]);
  if (result.exitCode !== 0) throw new Error(result.stderr.toString());
  return JSON.parse(result.stdout.toString()).rows;
}

test("live event policies restrict history while preserving discovery and administrator access", () => {
  const policies = query("SELECT policyname, roles::text AS roles, qual FROM pg_policies WHERE schemaname='public' AND tablename='video_date_events'");
  const listing = policies.find(row => row.policyname === "Anyone can see video events");
  const admin = policies.find(row => row.policyname === "Admins manage video events");
  expect(listing?.roles).toBe("{authenticated}");
  expect(admin?.qual).toBe("has_role(auth.uid(), 'admin'::app_role)");
  if (typeof listing?.qual !== "string") throw new Error("Missing event read policy");
  const predicate = listing.qual
    .replaceAll("auth.uid()", "caller")
    .replace(/(?:public\.)?is_video_date_participant\(id, caller\)/g, "joined");
  const rows = query(`
    WITH fixtures(label, caller, status, scheduled_at, joined, administrator) AS (
      VALUES
      ('member upcoming', '00000000-0000-0000-0000-000000000001'::uuid, 'upcoming', now() + interval '1 day', false, false),
      ('member active', '00000000-0000-0000-0000-000000000001'::uuid, 'active', now() + interval '1 day', false, false),
      ('unrelated completed', '00000000-0000-0000-0000-000000000001'::uuid, 'completed', now() - interval '1 day', false, false),
      ('unrelated cancelled', '00000000-0000-0000-0000-000000000001'::uuid, 'cancelled', now() + interval '1 day', false, false),
      ('expired upcoming', '00000000-0000-0000-0000-000000000001'::uuid, 'upcoming', now() - interval '1 day', false, false),
      ('participant history', '00000000-0000-0000-0000-000000000001'::uuid, 'completed', now() - interval '1 day', true, false),
      ('administrator history', '00000000-0000-0000-0000-000000000001'::uuid, 'cancelled', now() - interval '1 day', false, true),
      ('anonymous upcoming', NULL::uuid, 'upcoming', now() + interval '1 day', false, false)
    ) SELECT label, ((${predicate}) OR administrator) AS allowed FROM fixtures
  `);
  expect(Object.fromEntries(rows.map(row => [row.label, row.allowed]))).toEqual({
    "member upcoming": true,
    "member active": true,
    "unrelated completed": false,
    "unrelated cancelled": false,
    "expired upcoming": false,
    "participant history": true,
    "administrator history": true,
    "anonymous upcoming": false,
  });
}, 60000);