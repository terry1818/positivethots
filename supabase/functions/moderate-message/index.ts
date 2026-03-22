import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { content, sender_id, match_id } = await req.json();
    if (!content || !sender_id || !match_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
            content: `You are a content moderation classifier for a dating app. Classify the user message as "safe" or "flagged".

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
- Discussions about relationships, dating, or intimacy

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
