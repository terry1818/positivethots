import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { content, sender_id, match_id } = await req.json();
    if (!content || !sender_id || !match_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the authenticated user is the sender
    if (sender_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden: sender mismatch" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user is a participant in the match
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: match, error: matchErr } = await adminClient
      .from("matches")
      .select("id")
      .eq("id", match_id)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .maybeSingle();

    if (matchErr || !match) {
      return new Response(JSON.stringify({ error: "Forbidden: not a match participant" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: max 10 messages per 60 seconds per user per match
    const sixtySecondsAgo = new Date(Date.now() - 60000).toISOString();
    const { count: recentCount } = await adminClient
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", userId)
      .eq("match_id", match_id)
      .gte("created_at", sixtySecondsAgo);

    if (recentCount !== null && recentCount >= 10) {
      return new Response(JSON.stringify({ error: "Sending too fast. Please wait a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a content moderation classifier for a relationship wellness community app. Classify the user message as "safe" or "flagged".

Flag messages that contain:
- Hate speech, slurs, or discriminatory language
- Threats of violence or self-harm
- Explicit solicitation of minors
- Sharing of personal financial information (bank accounts, SSNs)
- Spam or scam attempts (phishing links, "send money" schemes)
- Doxxing or sharing others' private information

Do NOT flag:
- Normal flirting or romantic conversation
- Adult language between consenting adults
- Mild profanity or casual swearing
- Discussions about relationships, wellness, or intimacy

Respond with ONLY a JSON object: {"verdict":"safe"} or {"verdict":"flagged","reason":"brief reason"}`
          },
          { role: "user", content }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ verdict: "safe", note: "rate_limited" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ verdict: "safe", note: "credits_exhausted" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", response.status);
      return new Response(JSON.stringify({ verdict: "safe", note: "ai_error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || "";

    let result: { verdict: string; reason?: string };
    try {
      const cleaned = aiContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      result = { verdict: "safe" };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("moderate-message error:", e);
    // Fail open - don't block messages if moderation fails
    return new Response(JSON.stringify({ verdict: "safe", note: "error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
