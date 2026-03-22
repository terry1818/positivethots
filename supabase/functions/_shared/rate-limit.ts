// Simple in-memory rate limiter for edge functions
// Uses a sliding window approach per IP address
const requests = new Map<string, number[]>();

const WINDOW_MS = 60_000; // 1 minute
const CLEANUP_INTERVAL = 5 * 60_000; // cleanup every 5 min

let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - WINDOW_MS;
  for (const [key, timestamps] of requests) {
    const valid = timestamps.filter((t) => t > cutoff);
    if (valid.length === 0) requests.delete(key);
    else requests.set(key, valid);
  }
}

export function rateLimit(
  req: Request,
  maxRequests: number = 10
): { limited: boolean; remaining: number } {
  cleanup();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";

  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const timestamps = (requests.get(ip) || []).filter((t) => t > cutoff);
  timestamps.push(now);
  requests.set(ip, timestamps);

  const remaining = Math.max(0, maxRequests - timestamps.length);
  return { limited: timestamps.length > maxRequests, remaining };
}

export function rateLimitResponse(corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": "60",
      },
    }
  );
}
