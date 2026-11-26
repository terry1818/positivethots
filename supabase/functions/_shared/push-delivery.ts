// Push delivery to Android (Firebase Cloud Messaging HTTP v1) and iOS (APNs, token auth).
//
// Nothing is sent until the secrets below exist in the project's edge-function secrets.
// Until then every send is skipped with reason "not_configured", which matches the behaviour
// before this file existed.
//
//   Android: FCM_SERVICE_ACCOUNT_JSON  the whole service-account JSON from
//            Firebase console > Project settings > Service accounts > Generate new private key
//   iOS:     APNS_KEY_P8      contents of the AuthKey_XXXXXXXXXX.p8 file (Apple Developer > Keys)
//            APNS_KEY_ID      the 10-character Key ID shown next to that key
//            APNS_TEAM_ID     the 10-character Team ID (Apple Developer > Membership)
//            APNS_BUNDLE_ID   optional, defaults to app.positivethots.main
//            APNS_PRODUCTION  "true" for App Store / TestFlight builds, anything else = sandbox
//
// Tokens that Apple or Google report as dead are returned in `invalidTokens` so the caller can
// delete them from device_tokens.

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface DeviceToken {
  token: string;
  platform: string | null;
}

export interface DeliveryResult {
  delivered: number;
  skipped: number;
  failed: number;
  invalidTokens: string[];
  notConfigured: string[];
}

const b64url = (bytes: Uint8Array | string): string => {
  const bin = typeof bytes === "string" ? bytes : String.fromCharCode(...bytes);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const pemToDer = (pem: string): Uint8Array<ArrayBuffer> => {
  const body = pem.replace(/-----[^-]+-----/g, "").replace(/\\n/g, "").replace(/\s+/g, "");
  return Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
};

async function signJwt(
  header: Record<string, unknown>,
  claims: Record<string, unknown>,
  pem: string,
  alg: "RS256" | "ES256",
): Promise<string> {
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
  const keyAlg = alg === "RS256"
    ? { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }
    : { name: "ECDSA", namedCurve: "P-256" };
  const key = await crypto.subtle.importKey("pkcs8", pemToDer(pem), keyAlg, false, ["sign"]);
  const signAlg = alg === "RS256" ? { name: "RSASSA-PKCS1-v1_5" } : { name: "ECDSA", hash: "SHA-256" };
  // WebCrypto ECDSA returns the raw r||s form that JWS ES256 expects.
  const sig = new Uint8Array(await crypto.subtle.sign(signAlg, key, new TextEncoder().encode(unsigned)));
  return `${unsigned}.${b64url(sig)}`;
}

// ---------- Android (FCM HTTP v1) ----------

interface ServiceAccount { client_email: string; private_key: string; project_id: string }
let fcmCache: { token: string; exp: number } | null = null;

function fcmAccount(): ServiceAccount | null {
  const raw = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw) as ServiceAccount;
    return sa.client_email && sa.private_key && sa.project_id ? sa : null;
  } catch {
    return null;
  }
}

async function fcmAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (fcmCache && fcmCache.exp - 60 > now) return fcmCache.token;
  const assertion = await signJwt(
    { alg: "RS256", typ: "JWT" },
    {
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    },
    sa.private_key,
    "RS256",
  );
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!res.ok) throw new Error(`FCM auth failed: ${res.status}`);
  const json = await res.json();
  fcmCache = { token: json.access_token, exp: now + (json.expires_in ?? 3600) };
  return fcmCache.token;
}

async function sendFcm(sa: ServiceAccount, token: string, msg: PushMessage): Promise<"ok" | "invalid" | "failed"> {
  const access = await fcmAccessToken(sa);
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        token,
        notification: { title: msg.title, body: msg.body },
        data: msg.data ?? {},
        // PRIVATE: Android hides the content on a secure lock screen.
        android: { priority: "high", notification: { visibility: "PRIVATE", channel_id: "default" } },
      },
    }),
  });
  if (res.ok) return "ok";
  const text = await res.text();
  if (res.status === 404 || /UNREGISTERED|INVALID_ARGUMENT.*registration/i.test(text)) return "invalid";
  console.error(`FCM send failed ${res.status}: ${text.slice(0, 300)}`);
  return "failed";
}

// ---------- iOS (APNs, token-based auth) ----------

let apnsCache: { jwt: string; iat: number } | null = null;

function apnsConfig() {
  const key = Deno.env.get("APNS_KEY_P8");
  const keyId = Deno.env.get("APNS_KEY_ID");
  const teamId = Deno.env.get("APNS_TEAM_ID");
  if (!key || !keyId || !teamId) return null;
  return {
    key,
    keyId,
    teamId,
    bundleId: Deno.env.get("APNS_BUNDLE_ID") || "app.positivethots.main",
    host: Deno.env.get("APNS_PRODUCTION") === "true" ? "api.push.apple.com" : "api.sandbox.push.apple.com",
  };
}

async function apnsJwt(cfg: NonNullable<ReturnType<typeof apnsConfig>>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  // Apple wants the token refreshed no more than once every 20 minutes and no less than hourly.
  if (apnsCache && now - apnsCache.iat < 45 * 60) return apnsCache.jwt;
  const jwt = await signJwt({ alg: "ES256", kid: cfg.keyId }, { iss: cfg.teamId, iat: now }, cfg.key, "ES256");
  apnsCache = { jwt, iat: now };
  return jwt;
}

async function sendApns(
  cfg: NonNullable<ReturnType<typeof apnsConfig>>,
  token: string,
  msg: PushMessage,
): Promise<"ok" | "invalid" | "failed"> {
  const res = await fetch(`https://${cfg.host}/3/device/${token}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${await apnsJwt(cfg)}`,
      "apns-topic": cfg.bundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    },
    body: JSON.stringify({ aps: { alert: { title: msg.title, body: msg.body }, sound: "default" }, ...msg.data }),
  });
  if (res.ok) return "ok";
  const text = await res.text();
  if (res.status === 410 || /BadDeviceToken|Unregistered/.test(text)) return "invalid";
  console.error(`APNs send failed ${res.status}: ${text.slice(0, 300)}`);
  return "failed";
}

// ---------- Public entry point ----------

export async function deliverPush(tokens: DeviceToken[], msg: PushMessage): Promise<DeliveryResult> {
  const result: DeliveryResult = { delivered: 0, skipped: 0, failed: 0, invalidTokens: [], notConfigured: [] };
  const sa = fcmAccount();
  const apns = apnsConfig();

  for (const t of tokens) {
    const platform = (t.platform ?? "").toLowerCase();
    try {
      let outcome: "ok" | "invalid" | "failed";
      if (platform === "android") {
        if (!sa) { result.skipped++; result.notConfigured.push("android"); continue; }
        outcome = await sendFcm(sa, t.token, msg);
      } else if (platform === "ios") {
        if (!apns) { result.skipped++; result.notConfigured.push("ios"); continue; }
        outcome = await sendApns(apns, t.token, msg);
      } else {
        result.skipped++;
        continue;
      }
      if (outcome === "ok") result.delivered++;
      else if (outcome === "invalid") result.invalidTokens.push(t.token);
      else result.failed++;
    } catch (e) {
      console.error(`Push to ${platform} failed:`, (e as Error).message);
      result.failed++;
    }
  }
  result.notConfigured = [...new Set(result.notConfigured)];
  return result;
}
