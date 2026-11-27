export type SubscriptionTier = "free" | "plus" | "premium" | "vip";

export type FeatureKey =
  | "see_likes"
  | "super_likes"
  | "priority_visibility"
  | "advanced_filters"
  | "profile_boost"
  | "unlimited_super_likes"
  | "mentor_badge"
  | "verified_educator"
  | "community_host";

interface TierConfig {
  name: string;
  tier: SubscriptionTier;
  /** Product key sent to the ccbill-checkout function; the server holds the real price (supabase/functions/_shared/ccbill-core.ts). */
  productKey: string;
  price: number;
  billingPeriod: "monthly" | "annual";
  annualMonthlyEquivalent?: number;
  features: FeatureKey[];
  highlight?: boolean;
}

export const SUBSCRIPTION_TIERS: TierConfig[] = [
  // Monthly
  {
    name: "Plus",
    tier: "plus",
    productKey: "plus_monthly",
    price: 4.99,
    billingPeriod: "monthly",
    features: ["see_likes", "super_likes"],
  },
  {
    name: "Premium",
    tier: "premium",
    productKey: "premium_monthly",
    price: 9.99,
    billingPeriod: "monthly",
    features: ["see_likes", "super_likes", "priority_visibility", "advanced_filters"],
    highlight: true,
  },
  {
    name: "VIP",
    tier: "vip",
    productKey: "vip_monthly",
    price: 19.99,
    billingPeriod: "monthly",
    features: [
      "see_likes",
      "super_likes",
      "priority_visibility",
      "advanced_filters",
      "profile_boost",
      "unlimited_super_likes",
      "mentor_badge",
    ],
  },
  // Annual (~20% discount)
  {
    name: "Plus",
    tier: "plus",
    productKey: "plus_annual",
    price: 47.99,
    billingPeriod: "annual",
    annualMonthlyEquivalent: 4.00,
    features: ["see_likes", "super_likes"],
  },
  {
    name: "Premium",
    tier: "premium",
    productKey: "premium_annual",
    price: 95.99,
    billingPeriod: "annual",
    annualMonthlyEquivalent: 8.00,
    features: ["see_likes", "super_likes", "priority_visibility", "advanced_filters"],
    highlight: true,
  },
  {
    name: "VIP",
    tier: "vip",
    productKey: "vip_annual",
    price: 191.99,
    billingPeriod: "annual",
    annualMonthlyEquivalent: 16.00,
    features: [
      "see_likes",
      "super_likes",
      "priority_visibility",
      "advanced_filters",
      "profile_boost",
      "unlimited_super_likes",
      "mentor_badge",
    ],
  },
];

export const MONTHLY_TIERS = SUBSCRIPTION_TIERS.filter((t) => t.billingPeriod === "monthly");
export const ANNUAL_TIERS = SUBSCRIPTION_TIERS.filter((t) => t.billingPeriod === "annual");

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  see_likes: "See who wants to connect",
  super_likes: "5 Thots a day",
  priority_visibility: "Priority visibility",
  advanced_filters: "Advanced filters",
  profile_boost: "1 Profile Boost a month",
  unlimited_super_likes: "Unlimited Thots",
  mentor_badge: "Mentor badge",
  verified_educator: "Verified Educator badge",
  community_host: "Host community events",
};

export const ALL_FEATURES: FeatureKey[] = [
  "see_likes",
  "super_likes",
  "priority_visibility",
  "advanced_filters",
  "profile_boost",
  "unlimited_super_likes",
  "mentor_badge",
];

// "Verified Educator badge" and "Host community events" are not built and are not in the published
// pricing, so no plan lists them. Add them back to a plan only when the feature exists.
const PLAN_ORDER: SubscriptionTier[] = ["plus", "premium", "vip"];

/** What a plan adds on top of the one below it, so each plan is a short list. */
export function planAdds(tier: SubscriptionTier): { includes: string | null; adds: FeatureKey[] } {
  const at = PLAN_ORDER.indexOf(tier);
  const own = MONTHLY_TIERS.find((t) => t.tier === tier)?.features ?? [];
  if (at <= 0) return { includes: null, adds: own };
  const below = MONTHLY_TIERS.find((t) => t.tier === PLAN_ORDER[at - 1]);
  return { includes: below?.name ?? null, adds: own.filter((f) => !(below?.features ?? []).includes(f)) };
}

export function getTierByPlan(plan: string | null | undefined): SubscriptionTier {
  return plan === "plus" || plan === "premium" || plan === "vip" ? plan : "free";
}

export function getTierConfig(tier: SubscriptionTier) {
  return SUBSCRIPTION_TIERS.find((t) => t.tier === tier && t.billingPeriod === "monthly");
}

export function tierHasFeature(tier: SubscriptionTier, feature: FeatureKey): boolean {
  if (tier === "free") return false;
  const config = getTierConfig(tier);
  return config?.features.includes(feature) ?? false;
}

// One-time purchase product IDs
export const ONE_TIME_PRODUCTS = {
  profile_boost: {
    productKey: "profile_boost",
    price: 2.99,
    name: "Profile Boost",
  },
  super_like_pack_5: {
    productKey: "thot_pack_5",
    price: 1.99,
    name: "Thot Pack (5)",
    packSize: 5,
  },
  super_like_pack_10: {
    productKey: "thot_pack_10",
    price: 3.99,
    name: "Thot Pack (10)",
    packSize: 10,
  },
} as const;
