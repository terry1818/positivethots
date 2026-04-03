import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Rate limit: 3 attempts/user/day
const userAttempts = new Map<string, { count: number; date: string }>();

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { ...cors, "Access-Control-Allow-Methods": "POST, OPTIONS" } });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authError } = await createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const today = new Date().toISOString().slice(0, 10);

    // Rate limiting
    const userEntry = userAttempts.get(userId);
    if (userEntry) {
      if (userEntry.date !== today) {
        userAttempts.set(userId, { count: 1, date: today });
      } else if (userEntry.count >= 3) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again tomorrow." }), {
          status: 429,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      } else {
        userEntry.count++;
      }
    } else {
      userAttempts.set(userId, { count: 1, date: today });
    }

    const { action, platform, platform_username, verification_code } = await req.json();

    if (action === "link") {
      // Generate verification code and create/update the link
      const code = `PT-${generateCode(6)}`;
      
      const { data, error } = await supabaseUser
        .from("external_platform_links")
        .upsert({
          user_id: userId,
          platform: platform || "fetlife",
          platform_username: platform_username.trim(),
          verification_code: code,
          status: "pending",
          linked_at: new Date().toISOString(),
          verified_at: null,
        }, { onConflict: "user_id,platform" })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, verification_code: code, link: data }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      // Mark as self_reported (trust-based verification)
      const { data, error } = await supabaseUser
        .from("external_platform_links")
        .update({
          status: "self_reported",
          verified_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("platform", platform || "fetlife")
        .eq("verification_code", verification_code)
        .select()
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({ error: "Verification failed. Check your code and try again." }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, link: data }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (action === "unlink") {
      const { error } = await supabaseUser
        .from("external_platform_links")
        .delete()
        .eq("user_id", userId)
        .eq("platform", platform || "fetlife");

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});

function generateCode(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
