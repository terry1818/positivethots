// Deletes verification selfies older than 24 hours that were never cleaned up
// (for example the app closed after upload, before the check ran).
// The Privacy Policy promises selfies are never kept longer than 24 hours; this job enforces it.
// Called once an hour by pg_cron with the service-role key. Anyone else gets 401.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const BUCKET = "verification-selfies";

serve(async (req) => {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (req.headers.get("Authorization") !== `Bearer ${serviceKey}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", serviceKey, { auth: { persistSession: false } });
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let removed = 0;
  const errors: string[] = [];

  const sweep = async (table: string, col: string) => {
    const { data, error } = await admin.from(table).select(`id, ${col}`).not(col, "is", null).neq(col, "").lt("created_at", cutoff).limit(500);
    if (error) { errors.push(`${table}: ${error.message}`); return; }
    const rows = (data ?? []) as unknown as Record<string, string>[];
    if (!rows.length) return;
    const { error: rmErr } = await admin.storage.from(BUCKET).remove(rows.map((r) => r[col]));
    if (rmErr) { errors.push(`${table} storage: ${rmErr.message}`); return; }
    // selfie_path is NOT NULL, so that column is blanked instead of nulled.
    const cleared = col === "selfie_path" ? "" : null;
    const { error: upErr } = await admin.from(table).update({ [col]: cleared }).in("id", rows.map((r) => r.id));
    if (upErr) errors.push(`${table} update: ${upErr.message}`);
    removed += rows.length;
  };

  await sweep("face_verifications", "selfie_url");
  await sweep("verification_requests", "selfie_path");

  if (errors.length) {
    await admin.from("error_logs").insert({ error_message: `purge-stale-selfies: ${errors.join("; ")}`, page_url: "cron:purge-stale-selfies" }).then(() => {}, () => {});
  }
  return new Response(JSON.stringify({ removed, errors }), { headers: { "Content-Type": "application/json" } });
});
