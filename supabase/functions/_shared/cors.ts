const ALLOWED_ORIGINS = [
  "https://positivethots.app",
  "https://positivethots.lovable.app",
  "https://zcsnqvncqzpleqoctzfc.supabase.co",
];

const ALLOWED_PATTERNS = [
  /^https:\/\/.*\.lovable\.app$/,
  /^https:\/\/.*\.lovableproject\.com$/,
];

const STANDARD_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

export function getCorsHeaders(
  req: Request,
  extraHeaders?: string,
): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    ALLOWED_PATTERNS.some((p) => p.test(origin));

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": extraHeaders
      ? `${STANDARD_HEADERS}, ${extraHeaders}`
      : STANDARD_HEADERS,
  };
}

/** Permissive CORS for endpoints called by email clients (any origin). */
export function getPermissiveCorsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": STANDARD_HEADERS,
  };
}
