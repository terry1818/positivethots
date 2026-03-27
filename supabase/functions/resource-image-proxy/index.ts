import { getCorsHeaders } from "../_shared/cors.ts";

const AMAZON_HOSTS = new Set([
  "m.media-amazon.com",
  "images-na.ssl-images-amazon.com",
  "ws-na.amazon-adsystem.com",
]);

const buildDirectImageUrl = (url: string) => {
  try {
    const parsed = new URL(url);

    if (parsed.hostname === "ws-na.amazon-adsystem.com") {
      const asin = parsed.searchParams.get("ASIN");
      if (asin) {
        return `https://m.media-amazon.com/images/P/${asin}.jpg`;
      }
    }

    return url;
  } catch {
    return url;
  }
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestUrl = new URL(req.url);
    const src = requestUrl.searchParams.get("src");

    if (!src) {
      return new Response(JSON.stringify({ error: "Missing src parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalized = buildDirectImageUrl(src);
    const parsedSrc = new URL(normalized);

    if (!AMAZON_HOSTS.has(parsedSrc.hostname)) {
      return new Response(JSON.stringify({ error: "Host not allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch(normalized, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PositiveThotsBot/1.0)",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Referer": "https://www.amazon.com/",
      },
    });

    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: `Upstream returned ${upstream.status}` }), {
        status: upstream.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const cacheControl = upstream.headers.get("cache-control") || "public, max-age=86400";
    const body = await upstream.arrayBuffer();

    return new Response(body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
      },
    });
  } catch (error) {
    console.error("resource-image-proxy error", error);
    return new Response(JSON.stringify({ error: "Failed to proxy image" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
