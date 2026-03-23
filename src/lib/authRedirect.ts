const PUBLISHED_APP_URL = "https://positivethots.lovable.app";

const PREVIEW_HOST_PATTERNS = [
  "lovableproject.com",
  "id-preview--",
];

export const getAuthRedirectOrigin = () => {
  if (typeof window === "undefined") return PUBLISHED_APP_URL;

  const { origin, hostname } = window.location;
  const isPreviewHost =
    PREVIEW_HOST_PATTERNS.some((pattern) => hostname.includes(pattern)) ||
    hostname.endsWith(".lovableproject.com");

  return isPreviewHost ? PUBLISHED_APP_URL : origin;
};

export const buildAuthRedirectUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, `${getAuthRedirectOrigin()}/`).toString();
};
