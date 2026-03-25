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
  productId: string;
  priceId: string;
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
    productId: "prod_UC8hgE8GHk3Jz2",
    priceId: "price_1TDkQ9AEIVQtquY2C4kfHe4d",
    price: 4.99,
    billingPeriod: "monthly",
    features: ["see_likes", "super_likes"],
  },
  {
    name: "Premium",
    tier: "premium",
    productId: "prod_TyazHeNgEAjKEg",
    priceId: "price_1TDjjHQL8g2unk5Zfe9VvytG",
    price: 9.99,
    billingPeriod: "monthly",
    features: ["see_likes", "super_likes", "priority_visibility", "advanced_filters"],
    highlight: true,
  },
  {
    name: "VIP",
    tier: "vip",
    productId: "prod_UC8igDQOTInDei",
    priceId: "price_1TDkQpAEIVQtquY2s6feqEgV",
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
      "verified_educator",
      "community_host",
    ],
  },
  // Annual (~20% discount)
  {
    name: "Plus",
    tier: "plus",
    productId: "prod_ANNUAL_PLUS",
    priceId: "ANNUAL_PLUS_PRICE_ID",
    price: 47.99,
    billingPeriod: "annual",
    annualMonthlyEquivalent: 4.00,
    features: ["see_likes", "super_likes"],
  },
  {
    name: "Premium",
    tier: "premium",
    productId: "prod_ANNUAL_PREMIUM",
    priceId: "ANNUAL_PREMIUM_PRICE_ID",
    price: 95.99,
    billingPeriod: "annual",
    annualMonthlyEquivalent: 8.00,
    features: ["see_likes", "super_likes", "priority_visibility", "advanced_filters"],
    highlight: true,
  },
  {
    name: "VIP",
    tier: "vip",
    productId: "prod_ANNUAL_VIP",
    priceId: "ANNUAL_VIP_PRICE_ID",
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
      "verified_educator",
      "community_host",
    ],
  },
];

export const MONTHLY_TIERS = SUBSCRIPTION_TIERS.filter((t) => t.billingPeriod === "monthly");
export const ANNUAL_TIERS = SUBSCRIPTION_TIERS.filter((t) => t.billingPeriod === "annual");

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  see_likes: "See Who Likes You",
  super_likes: "5 Thots/day",
  priority_visibility: "Priority Visibility",
  advanced_filters: "Advanced Filters",
  profile_boost: "1 Profile Boost/mo",
  unlimited_super_likes: "Unlimited Thots",
  mentor_badge: "Mentor Badge",
  verified_educator: "Verified Educator Badge",
  community_host: "Host Community Events",
};

export const ALL_FEATURES: FeatureKey[] = [
  "see_likes",
  "super_likes",
  "priority_visibility",
  "advanced_filters",
  "profile_boost",
  "unlimited_super_likes",
  "mentor_badge",
  "verified_educator",
  "community_host",
];

export function getTierByProductId(productId: string): SubscriptionTier {
  const tier = SUBSCRIPTION_TIERS.find((t) => t.productId === productId);
  return tier?.tier ?? "free";
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
    productId: "prod_UC8rptUQyJjuTX",
    priceId: "price_1TDkZwAEIVQtquY2bChArXyZ",
    price: 2.99,
    name: "Profile Boost",
  },
  super_like_pack_5: {
    productId: "prod_SbSVkKVkIvYeSB",
    priceId: "price_1TOGT3AEIVQtquY2Zxm1pWeN",
    price: 1.99,
    name: "Thot Pack (5)",
    packSize: 5,
  },
  super_like_pack_10: {
    productId: "prod_UC8stYS4Xx9hot",
    priceId: "price_1TDkaqAEIVQtquY2l8yO6Xf3",
    price: 3.99,
    name: "Super Like Pack (10)",
    packSize: 10,
  },
} as const;
