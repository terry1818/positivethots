import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const GOOGLE_TTS_API_KEY = Deno.env.get("GOOGLE_TTS_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const VOICE_MAP: Record<string, { name: string; ssmlGender: string }> = {
  female: { name: "en-US-Neural2-F", ssmlGender: "FEMALE" },
  male: { name: "en-US-Neural2-D", ssmlGender: "MALE" },
};

// Per-user rate limiting: 20 requests/hour
const userRequests = new Map<string, number[]>();
const HOUR_MS = 3_600_000;
const MAX_PER_HOUR = 20;

// Daily character budget: ~$5/day ≈ 312,500 chars at $16/1M chars
const DAILY_CHAR_LIMIT = 312_500;
let dailyCharsUsed = 0;
let dailyResetDate = new Date().toISOString().slice(0, 10);

function checkDailyBudget(charCount: number): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== dailyResetDate) {
    dailyResetDate = today;
    dailyCharsUsed = 0;
  }
  if (dailyCharsUsed + charCount > DAILY_CHAR_LIMIT) return false;
  dailyCharsUsed += charCount;
  return true;
}

function checkUserRate(userId: string): boolean {
  const now = Date.now();
  const cutoff = now - HOUR_MS;
  const timestamps = (userRequests.get(userId) || []).filter(t => t > cutoff);
  if (timestamps.length >= MAX_PER_HOUR) return false;
  timestamps.push(now);
  userRequests.set(userId, timestamps);
  return true;
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!
    ).auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Rate limit per user
    if (!checkUserRate(user.id)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
        status: 429,
        headers: { ...cors, "Content-Type": "application/json", "Retry-After": "300" },
      });
    }

    const { text, voice = "female", speed = 1.0 } = await req.json();

    if (!text || typeof text !== "string" || text.length === 0) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (text.length > 5000) {
      return new Response(JSON.stringify({ error: "Text too long (max 5000 chars)" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const validVoice = voice === "male" ? "male" : "female";
    const validSpeed = Math.max(0.5, Math.min(2.0, Number(speed) || 1.0));

    // Cache key
    const cacheKey = await sha256(`${text}|${validVoice}|${validSpeed}`);
    const storagePath = `${cacheKey}.mp3`;

    // Check if cached
    const { data: existing } = await supabase.storage
      .from("tts-audio")
      .createSignedUrl(storagePath, 3600);

    if (existing?.signedUrl) {
      return new Response(JSON.stringify({ audioUrl: existing.signedUrl, cached: true }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Check daily budget
    if (!checkDailyBudget(text.length)) {
      return new Response(JSON.stringify({ error: "Daily TTS budget exceeded. Using device voice." }), {
        status: 429,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Call Google Cloud TTS
    const voiceConfig = VOICE_MAP[validVoice];
    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: "en-US",
            name: voiceConfig.name,
            ssmlGender: voiceConfig.ssmlGender,
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: validSpeed,
            pitch: 0,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text();
      console.error("Google TTS error:", errText);
      return new Response(JSON.stringify({ error: "TTS generation failed" }), {
        status: 502,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const ttsData = await ttsResponse.json();
    const audioContent = ttsData.audioContent; // base64

    // Decode and upload to storage
    const binaryStr = atob(audioContent);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const { error: uploadError } = await supabase.storage
      .from("tts-audio")
      .upload(storagePath, bytes, {
        contentType: "audio/mpeg",
        cacheControl: "31536000", // 1 year cache
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
    }

    // Get signed URL
    const { data: signedData } = await supabase.storage
      .from("tts-audio")
      .createSignedUrl(storagePath, 3600);

    const audioUrl = signedData?.signedUrl;

    if (!audioUrl) {
      // Fallback: return as data URL
      return new Response(
        JSON.stringify({ audioUrl: `data:audio/mpeg;base64,${audioContent}`, cached: false }),
        { headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ audioUrl, cached: false }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("TTS error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
