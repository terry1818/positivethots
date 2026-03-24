import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseAIJson(content: string): Record<string, unknown> | null {
  if (!content) return null;
  // Strip markdown code fences
  const stripped = content.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
  const jsonMatch = stripped.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      console.error("JSON parse failed for:", jsonMatch[0]);
    }
  }
  return null;
}

async function callAI(apiKey: string, messages: unknown[]) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("AI gateway error:", response.status, text);
    throw new Error(`AI gateway returned ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  console.log("Raw AI response:", content);
  return content;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { photo_id, mode } = await req.json();

    if (mode === "verification") {
      return await handleVerification(supabaseAdmin, user, photo_id, lovableApiKey);
    }

    return await handleModeration(supabaseAdmin, user, photo_id, lovableApiKey);
  } catch (error) {
    console.error("Error in moderate-photo:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleVerification(
  supabaseAdmin: any, user: any, photo_id: string, apiKey: string
) {
  const { data: verReq } = await supabaseAdmin
    .from("verification_requests")
    .select("*")
    .eq("id", photo_id)
    .eq("user_id", user.id)
    .single();

  if (!verReq) {
    return new Response(JSON.stringify({ error: "Verification request not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: selfieUrl } = supabaseAdmin.storage
    .from("user-photos")
    .getPublicUrl(verReq.selfie_path);

  const { data: userPhotos } = await supabaseAdmin
    .from("user_photos")
    .select("photo_url")
    .eq("user_id", user.id)
    .eq("moderation_status", "approved")
    .limit(3);

  const photoUrls = userPhotos?.map((p: any) => p.photo_url) || [];

  let verified = false;
  let reason = "Could not process verification";

  try {
    const content = await callAI(apiKey, [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are a verification system. Compare this selfie with the profile photos to determine if the same person appears in both. Respond with JSON only: {"verified": true/false, "reason": "brief explanation"}. If there are no profile photos to compare, respond with {"verified": false, "reason": "No profile photos available for comparison"}.`,
          },
          { type: "image_url", image_url: { url: selfieUrl.publicUrl } },
          ...photoUrls.map((url: string) => ({
            type: "image_url",
            image_url: { url },
          })),
        ],
      },
    ]);

    const parsed = parseAIJson(content);
    if (parsed) {
      verified = parsed.verified === true;
      reason = (parsed.reason as string) || reason;
    }
  } catch (err) {
    console.error("AI call failed for verification:", err);
    reason = "Verification service temporarily unavailable";
  }

  await supabaseAdmin
    .from("verification_requests")
    .update({
      status: verified ? "verified" : "rejected",
      reason,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", photo_id);

  if (verified) {
    await supabaseAdmin.from("profiles").update({ is_verified: true }).eq("id", user.id);
  }

  return new Response(JSON.stringify({ verified, reason }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleModeration(
  supabaseAdmin: any, user: any, photo_id: string, apiKey: string
) {
  const { data: photo } = await supabaseAdmin
    .from("user_photos")
    .select("*")
    .eq("id", photo_id)
    .eq("user_id", user.id)
    .single();

  if (!photo) {
    return new Response(JSON.stringify({ error: "Photo not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Default to approved (fail-open)
  let approved = true;
  let moderationReason: string | null = null;

  try {
    const content = await callAI(apiKey, [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are a content moderation system for a relationship wellness community app. Review this image and determine if it's appropriate. Reject images that contain: explicit nudity, violence, hate symbols, spam/ads, or images of minors. Tasteful/artistic content and swimwear are OK. Respond with JSON only: {"approved": true/false, "reason": "brief explanation if rejected"}`,
          },
          { type: "image_url", image_url: { url: photo.photo_url } },
        ],
      },
    ]);

    const parsed = parseAIJson(content);
    if (parsed) {
      approved = parsed.approved !== false; // default true unless explicitly false
      moderationReason = approved ? null : ((parsed.reason as string) || "Content policy violation");
    }
  } catch (err) {
    console.error("AI call failed for moderation:", err);
    // Fail-open: approve if AI is unreachable
    approved = true;
    moderationReason = null;
  }

  await supabaseAdmin
    .from("user_photos")
    .update({
      moderation_status: approved ? "approved" : "rejected",
      moderation_reason: approved ? null : moderationReason,
    })
    .eq("id", photo_id);

  // If first approved public photo, set as profile image
  if (approved && photo.visibility === "public" && photo.order_index === 0) {
    await supabaseAdmin.from("profiles").update({ profile_image: photo.photo_url }).eq("id", user.id);
  }

  return new Response(JSON.stringify({ approved, reason: moderationReason }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
