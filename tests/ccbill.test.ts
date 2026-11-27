import { describe, expect, test } from "bun:test";
import {
  CATALOG, buildFlexFormUrl, cancelUrl, ccbillDate, eventKey, isCCBillIp, md5, parseDataLinkResult,
  parseWebhookBody, planWebhook, recurringDigest, safeEqual, singleDigest,
} from "../supabase/functions/_shared/ccbill-core";
import { SUBSCRIPTION_TIERS, ONE_TIME_PRODUCTS } from "../src/lib/subscriptionTiers";

// The salt and expected hashes are CCBill's own published examples (https://ccbill.com/doc/formdigest-value).
const SALT = "7d901dad245fd0ff6bc20d06";

describe("formDigest", () => {
  test("single billing matches CCBill's example", () => {
    expect(md5("10.00308407d901dad245fd0ff6bc20d06")).toBe("a7459445d0e5dc0963fe736dc5cf900b");
    expect(singleDigest("10.00", 30, "840", SALT)).toBe("a7459445d0e5dc0963fe736dc5cf900b");
  });
  test("recurring billing matches CCBill's example", () => {
    expect(recurringDigest("10.00", 30, "10.00", 30, "99", "840", SALT)).toBe("48f0b12e4307e64edb781c479665c899");
  });
});

describe("FlexForm link", () => {
  const cfg = { subacc: "0000", flexformId: "abc-123", salt: SALT };
  test("subscription link carries recurring terms, digest and pass-throughs", () => {
    const u = new URL(buildFlexFormUrl(cfg, { productKey: "premium_monthly", price: 9.99, periodDays: 30, recurring: true, userId: "u1", email: "a@b.co" }));
    expect(u.origin + u.pathname).toBe("https://api.ccbill.com/wap-frontflex/flexforms/abc-123");
    const q = u.searchParams;
    expect(q.get("initialPrice")).toBe("9.99");
    expect(q.get("recurringPrice")).toBe("9.99");
    expect(q.get("recurringPeriod")).toBe("30");
    expect(q.get("numRebills")).toBe("99");
    expect(q.get("currencyCode")).toBe("840");
    expect(q.get("formDigest")).toBe(md5(`9.99309.9930998407d901dad245fd0ff6bc20d06`));
    expect(q.get("X-userId")).toBe("u1");
    expect(q.get("X-product")).toBe("premium_monthly");
    expect(q.get("email")).toBe("a@b.co");
  });
  test("one-time link has no recurring fields", () => {
    const q = new URL(buildFlexFormUrl(cfg, { productKey: "profile_boost", price: 2.99, periodDays: 2, recurring: false, userId: "u1" })).searchParams;
    expect(q.get("recurringPrice")).toBeNull();
    expect(q.get("formDigest")).toBe(singleDigest("2.99", 2, "840", SALT));
  });
});

describe("catalog matches the prices shown in the app", () => {
  test("every plan in subscriptionTiers has the same price on the server", () => {
    for (const t of SUBSCRIPTION_TIERS) {
      const p = CATALOG[t.productKey];
      expect(p?.kind).toBe("subscription");
      expect(p?.price).toBe(t.price);
    }
  });
  test("one-time products match", () => {
    for (const p of Object.values(ONE_TIME_PRODUCTS)) expect(CATALOG[p.productKey]?.price).toBe(p.price);
  });
});

describe("webhook security", () => {
  test("only CCBill's four IP blocks pass", () => {
    expect(isCCBillIp("64.38.212.10")).toBe(true);
    expect(isCCBillIp("64.38.241.254")).toBe(true);
    expect(isCCBillIp("64.38.212.0")).toBe(false);
    expect(isCCBillIp("64.38.213.10")).toBe(false);
    expect(isCCBillIp("64.38.212.10.evil.com")).toBe(false);
    expect(isCCBillIp(null)).toBe(false);
  });
  test("token compare", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("", "")).toBe(false);
  });
  test("reads JSON and URL-encoded bodies", () => {
    expect(parseWebhookBody("application/json", '{"subscriptionId":"123","X-userId":"u"}')["X-userId"]).toBe("u");
    expect(parseWebhookBody("application/x-www-form-urlencoded", "subscriptionId=123&X-product=vip_annual")["X-product"]).toBe("vip_annual");
  });
});

describe("webhook planning", () => {
  const now = new Date("2026-12-01T00:00:00Z");
  test("new subscription sale activates the plan until the next renewal", () => {
    const a = planWebhook("NewSaleSuccess", { subscriptionId: "S1", "X-userId": "u1", "X-product": "vip_annual", nextRenewalDate: "2027-12-01" }, now);
    expect(a).toEqual({ type: "activate_subscription", userId: "u1", plan: "vip", billing: "annual", subscriptionId: "S1", periodEnd: "2027-12-01T07:00:00.000Z" });
  });
  test("missing renewal date falls back to the plan period", () => {
    const a = planWebhook("NewSaleSuccess", { subscriptionId: "S1", "X-userId": "u1", "X-product": "plus_monthly" }, now);
    expect(a.type === "activate_subscription" && a.periodEnd).toBe("2026-12-31T00:00:00.000Z");
  });
  test("one-time purchases are fulfilled", () => {
    const a = planWebhook("NewSaleSuccess", { subscriptionId: "S2", transactionId: "T2", "X-userId": "u1", "X-product": "thot_pack_10", billedInitialPrice: "3.99" }, now);
    expect(a).toMatchObject({ type: "fulfil_one_time", productKey: "thot_pack_10", amount: 3.99 });
    expect(planWebhook("NewSaleSuccess", { subscriptionId: "S3", "X-userId": "u1", "X-product": "event:e1", "X-referenceId": "e1" }, now))
      .toMatchObject({ type: "fulfil_one_time", referenceId: "e1" });
  });
  test("sales without our pass-through values are ignored, never guessed", () => {
    expect(planWebhook("NewSaleSuccess", { subscriptionId: "S1" }, now).type).toBe("ignore");
    expect(planWebhook("NewSaleSuccess", { subscriptionId: "S1", "X-userId": "u", "X-product": "free_money" }, now).type).toBe("ignore");
  });
  test("lifecycle events", () => {
    expect(planWebhook("RenewalSuccess", { subscriptionId: "S1", nextRenewalDate: "2027-01-01" }, now)).toEqual({ type: "renew", subscriptionId: "S1", periodEnd: "2027-01-01T07:00:00.000Z" });
    expect(planWebhook("Cancellation", { subscriptionId: "S1", timestamp: "2026-12-05 10:00:00" }, now)).toEqual({ type: "mark_cancelled", subscriptionId: "S1", at: "2026-12-05T17:00:00.000Z" });
    expect(planWebhook("Expiration", { subscriptionId: "S1" }, now).type).toBe("expire");
    expect(planWebhook("Chargeback", { subscriptionId: "S1", amount: "9.99" }, now)).toEqual({ type: "reverse", subscriptionId: "S1", kind: "chargeback", amount: 9.99 });
    expect(planWebhook("Refund", { subscriptionId: "S1" }, now).type).toBe("reverse");
    expect(planWebhook("UserReactivation", { subscriptionId: "S1" }, now).type).toBe("reactivate");
    expect(planWebhook("CustomerDataUpdate", { subscriptionId: "S1" }, now).type).toBe("ignore");
  });
  test("retries get the same event key", () => {
    const b = { subscriptionId: "S1", transactionId: "T", timestamp: "2026-12-05 10:00:00" };
    expect(eventKey("RenewalSuccess", b)).toBe(eventKey("RenewalSuccess", { ...b }));
    expect(eventKey("RenewalSuccess", b)).not.toBe(eventKey("Refund", b));
  });
  test("CCBill dates are read as Phoenix time", () => {
    expect(ccbillDate("2026-01-15")).toBe("2026-01-15T07:00:00.000Z");
    expect(ccbillDate("nonsense")).toBeNull();
  });
});

describe("DataLink cancel", () => {
  test("request asks for XML and the right action", () => {
    const q = new URL(cancelUrl("900000", "0001", "user", "p&ss", "S1")).searchParams;
    expect(q.get("action")).toBe("cancelSubscription");
    expect(q.get("returnXML")).toBe("1");
    expect(q.get("password")).toBe("p&ss");
  });
  test("reads XML and CSV results", () => {
    expect(parseDataLinkResult("<?xml version='1.0' standalone='yes'?><results>1</results>")).toBe("1");
    expect(parseDataLinkResult('"results"\n"-8"')).toBe("-8");
    expect(parseDataLinkResult("garbage")).toBeNull();
  });
});
