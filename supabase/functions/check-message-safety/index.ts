import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { content } = await req.json();
    if (!content || typeof content !== "string" || content.length < 5) {
      return new Response(JSON.stringify({ classification: "safe" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
            content: `You are a consent-aware safety classifier for a relationship wellness community. Classify the message into ONE category:

- "safe" — normal conversation, flirting, casual chat
- "boundary_push" — pressuring about boundaries, "come on, just try it", ignoring stated limits
- "unsolicited_explicit" — sexual content without established mutual consent context
- "personal_info_early" — sharing phone numbers, addresses, financial info prematurely
- "manipulative" — guilt-tripping, love-bombing, gaslighting patterns

IMPORTANT: Do NOT over-flag. Adult flirting, casual language, and relationship discussions are SAFE.
Only flag clear violations of consent or safety norms.

Respond with JSON only:
{"classification":"safe"} 
or
{"classification":"boundary_push","explanation":"brief reason","suggested_rewrite":"gentler alternative"}`,
          },
          { role: "user", content },
        ],
      }),
    });

    if (!response.ok) {
      // Fail open
      return new Response(JSON.stringify({ classification: "safe" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || "";

    try {
      const cleaned = aiContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const result = JSON.parse(cleaned);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ classification: "safe" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("check-message-safety error:", e);
    return new Response(JSON.stringify({ classification: "safe", note: "error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
