// CCBill payment logic with no network or database access, so it can be unit-tested with bun
// (tests/ccbill.test.ts) and imported by the ccbill-* edge functions.
//
// Docs this follows (checked Nov 27, 2026):
//   Dynamic pricing FlexForms ...... https://ccbill.com/doc/dynamic-pricing-flexforms
//   formDigest formula ............. https://ccbill.com/doc/formdigest-value
//   Webhooks ....................... https://ccbill.com/doc/webhooks-user-guide
//   Cancel API (DataLink) .......... https://ccbill.com/doc/ccbill-api-cancel-subscription
import { createHash } from "node:crypto";

export type Plan = "plus" | "premium" | "vip";

export interface SubscriptionProduct {
  kind: "subscription";
  plan: Plan;
  billing: "monthly" | "annual";
  price: number; // USD, charged now and on every renewal
  periodDays: number;
}
export interface OneTimeProduct {
  kind: "boost" | "thot_pack";
  price: number;
  packSize?: number;
}
export type Product = SubscriptionProduct | OneTimeProduct;

// Prices must match src/lib/subscriptionTiers.ts and the Pricing section of the project instructions.
export const CATALOG: Record<string, Product> = {
  plus_monthly: { kind: "subscription", plan: "plus", billing: "monthly", price: 4.99, periodDays: 30 },
  premium_monthly: { kind: "subscription", plan: "premium", billing: "monthly", price: 9.99, periodDays: 30 },
  vip_monthly: { kind: "subscription", plan: "vip", billing: "monthly", price: 19.99, periodDays: 30 },
  plus_annual: { kind: "subscription", plan: "plus", billing: "annual", price: 47.99, periodDays: 365 },
  premium_annual: { kind: "subscription", plan: "premium", billing: "annual", price: 95.99, periodDays: 365 },
  vip_annual: { kind: "subscription", plan: "vip", billing: "annual", price: 191.99, periodDays: 365 },
  profile_boost: { kind: "boost", price: 2.99 },
  thot_pack_5: { kind: "thot_pack", price: 1.99, packSize: 5 },
  thot_pack_10: { kind: "thot_pack", price: 3.99, packSize: 10 },
};

// Dynamic items whose price lives in the database (coin packages, event tickets) use these prefixes.
export const COIN_PREFIX = "coins:";
export const EVENT_PREFIX = "event:";

export const USD = "840";
// CCBill's default number of rebills for a recurring price ("99" = renews until cancelled).
export const REBILLS = "99";
// Single-billing purchases still need an access period; 2 days is CCBill's minimum.
export const ONE_TIME_PERIOD_DAYS = 2;

export const money = (n: number): string => n.toFixed(2);
export const md5 = (s: string): string => createHash("md5").update(s).digest("hex");

/** formDigest for a one-time charge: md5(initialPrice + initialPeriod + currencyCode + salt). */
export function singleDigest(price: string, periodDays: number, currency: string, salt: string): string {
  return md5(`${price}${periodDays}${currency}${salt}`);
}

/** formDigest for a subscription: md5(initialPrice + initialPeriod + recurringPrice + recurringPeriod + numRebills + currencyCode + salt). */
export function recurringDigest(
  price: string, periodDays: number, recurringPrice: string, recurringPeriod: number, rebills: string, currency: string, salt: string,
): string {
  return md5(`${price}${periodDays}${recurringPrice}${recurringPeriod}${rebills}${currency}${salt}`);
}

export interface CCBillConfig {
  subacc: string;
  flexformId: string;
  salt: string;
}

export interface CheckoutInput {
  productKey: string;
  price: number;
  periodDays: number;
  recurring: boolean;
  userId: string;
  email?: string;
  referenceId?: string; // event id or coin package id
}

/** Builds the hosted FlexForm address. Card details are only ever entered on CCBill's page. */
export function buildFlexFormUrl(cfg: CCBillConfig, input: CheckoutInput): string {
  const price = money(input.price);
  const params = new URLSearchParams({
    clientSubacc: cfg.subacc,
    initialPrice: price,
    initialPeriod: String(input.periodDays),
    currencyCode: USD,
  });
  if (input.recurring) {
    params.set("recurringPrice", price);
    params.set("recurringPeriod", String(input.periodDays));
    params.set("numRebills", REBILLS);
    params.set("formDigest", recurringDigest(price, input.periodDays, price, input.periodDays, REBILLS, USD, cfg.salt));
  } else {
    params.set("formDigest", singleDigest(price, input.periodDays, USD, cfg.salt));
  }
  // Pass-through values come back on every webhook for this purchase. CCBill requires the X- prefix.
  params.set("X-userId", input.userId);
  params.set("X-product", input.productKey);
  if (input.referenceId) params.set("X-referenceId", input.referenceId);
  if (input.email) params.set("email", input.email);
  return `https://api.ccbill.com/wap-frontflex/flexforms/${encodeURIComponent(cfg.flexformId)}?${params.toString()}`;
}

// ---------- Webhooks ----------

// CCBill sends webhooks only from these four /24 blocks (.1 to .254).
const CCBILL_BLOCKS = ["64.38.212.", "64.38.215.", "64.38.240.", "64.38.241."];

export function isCCBillIp(ip: string | null | undefined): boolean {
  if (!ip) return false;
  const block = CCBILL_BLOCKS.find((b) => ip.startsWith(b));
  if (!block) return false;
  const last = Number(ip.slice(block.length));
  return Number.isInteger(last) && last >= 1 && last <= 254 && ip.slice(block.length) === String(last);
}

/** Constant-time string comparison for the secret webhook token. */
export function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Reads a webhook body in either format CCBill offers (JSON or URL-encoded). */
export function parseWebhookBody(contentType: string | null, raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  if ((contentType ?? "").includes("json")) {
    const obj = JSON.parse(raw || "{}") as Record<string, unknown>;
    for (const [k, v] of Object.entries(obj)) if (v !== null && v !== undefined) out[k] = String(v);
  } else {
    for (const [k, v] of new URLSearchParams(raw)) out[k] = v;
  }
  return out;
}

/** CCBill sends dates as "YYYY-MM-DD HH:MM:SS" (America/Phoenix) or "YYYY-MM-DD". Phoenix is UTC-7 all year. */
export function ccbillDate(s: string | undefined): string | null {
  if (!s) return null;
  const m = s.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}:\d{2}))?/);
  if (!m) return null;
  const d = new Date(`${m[1]}T${m[2] ?? "00:00:00"}-07:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export type WebhookAction =
  | { type: "activate_subscription"; userId: string; plan: Plan; billing: "monthly" | "annual"; subscriptionId: string; periodEnd: string }
  | { type: "fulfil_one_time"; userId: string; productKey: string; subscriptionId: string; transactionId: string | null; referenceId: string | null; amount: number | null }
  | { type: "renew"; subscriptionId: string; periodEnd: string | null }
  | { type: "renewal_failed"; subscriptionId: string; reason: string | null }
  | { type: "mark_cancelled"; subscriptionId: string; at: string }
  | { type: "expire"; subscriptionId: string }
  | { type: "reactivate"; subscriptionId: string; periodEnd: string | null }
  | { type: "reverse"; subscriptionId: string; kind: "chargeback" | "refund" | "void" | "return"; amount: number | null }
  | { type: "sale_failed"; userId: string | null; productKey: string | null; reason: string | null }
  | { type: "ignore"; reason: string };

const num = (v: string | undefined): number | null => (v === undefined || v === "" || Number.isNaN(Number(v)) ? null : Number(v));

/** Turns one webhook into exactly one database action. Pure: no I/O. */
export function planWebhook(eventType: string, b: Record<string, string>, now = new Date()): WebhookAction {
  const subscriptionId = b.subscriptionId ?? "";
  const userId = b["X-userId"] ?? b["X-userid"] ?? null;
  const productKey = b["X-product"] ?? null;
  if (!subscriptionId && eventType !== "NewSaleFailure") return { type: "ignore", reason: "no subscriptionId" };

  switch (eventType) {
    case "NewSaleSuccess": {
      if (!userId || !productKey) return { type: "ignore", reason: "missing X-userId or X-product pass-through" };
      const product = CATALOG[productKey];
      if (product?.kind === "subscription") {
        const periodEnd = ccbillDate(b.nextRenewalDate) ??
          new Date(now.getTime() + product.periodDays * 86_400_000).toISOString();
        return { type: "activate_subscription", userId, plan: product.plan, billing: product.billing, subscriptionId, periodEnd };
      }
      if (product || productKey.startsWith(COIN_PREFIX) || productKey.startsWith(EVENT_PREFIX)) {
        return {
          type: "fulfil_one_time", userId, productKey, subscriptionId,
          transactionId: b.transactionId ?? null, referenceId: b["X-referenceId"] ?? null,
          amount: num(b.billedInitialPrice ?? b.accountingInitialPrice ?? b.initialPrice),
        };
      }
      return { type: "ignore", reason: `unknown product ${productKey}` };
    }
    case "RenewalSuccess":
      return { type: "renew", subscriptionId, periodEnd: ccbillDate(b.nextRenewalDate) };
    case "RenewalFailure":
      return { type: "renewal_failed", subscriptionId, reason: b.failureReason ?? null };
    case "Cancellation":
      return { type: "mark_cancelled", subscriptionId, at: ccbillDate(b.timestamp) ?? now.toISOString() };
    case "Expiration":
      return { type: "expire", subscriptionId };
    case "UserReactivation":
      return { type: "reactivate", subscriptionId, periodEnd: ccbillDate(b.nextRenewalDate) };
    case "Chargeback":
    case "Refund":
    case "Void":
    case "Return":
      return {
        type: "reverse", subscriptionId, kind: eventType.toLowerCase() as "chargeback" | "refund" | "void" | "return",
        amount: num(b.amount ?? b.accountingAmount),
      };
    case "NewSaleFailure":
      return { type: "sale_failed", userId, productKey, reason: b.failureReason ?? null };
    default:
      return { type: "ignore", reason: `event ${eventType} not used` };
  }
}

/** Stable key so a webhook CCBill retries is only applied once. */
export function eventKey(eventType: string, b: Record<string, string>): string {
  return md5([eventType, b.subscriptionId ?? "", b.transactionId ?? "", b.timestamp ?? "", b.nextRenewalDate ?? ""].join("|"));
}

// ---------- DataLink cancel API ----------

export const DATALINK_CODES: Record<string, string> = {
  "1": "success",
  "0": "the requested action failed",
  "-1": "invalid DataLink username or password",
  "-2": "invalid subscription id",
  "-3": "no record for that subscription",
  "-4": "subscription belongs to another account",
  "-5": "invalid or missing arguments",
  "-6": "invalid action",
  "-7": "CCBill internal error",
  "-8": "request came from an IP address CCBill has not approved",
  "-9": "DataLink is deactivated for this account",
  "-10": "DataLink is not set up for this account",
  "-12": "too many failed logins in the last hour",
};

export function cancelUrl(accnum: string, subacc: string, user: string, pass: string, subscriptionId: string): string {
  const p = new URLSearchParams({
    clientAccnum: accnum, clientSubacc: subacc, username: user, password: pass,
    subscriptionId, action: "cancelSubscription", returnXML: "1",
  });
  return `https://datalink.ccbill.com/utils/subscriptionManagement.cgi?${p.toString()}`;
}

/** Reads the result code from DataLink's XML (<results>1</results>) or CSV ("results"\n"1") reply. */
export function parseDataLinkResult(body: string): string | null {
  const xml = body.match(/<results>\s*(-?\d+)\s*<\/results>/);
  if (xml) return xml[1];
  const csv = body.match(/"?(-?\d+)"?\s*$/);
  return csv ? csv[1] : null;
}
