export type SubscriptionTier = "free" | "plus" | "premium" | "vip";

export type FeatureKey =
  | "see_likes"
  | "super_likes"
  | "priority_visibility"
  | "advanced_filters"
  | "profile_boost"
  | "unlimited_super_likes"
  | "mentor_badge";

interface TierConfig {
  name: string;
  tier: SubscriptionTier;
  productId: string;
  priceId: string;
  price: number;
  features: FeatureKey[];
  highlight?: boolean;
}

export const SUBSCRIPTION_TIERS: TierConfig[] = [
  {
    name: "Plus",
    tier: "plus",
    productId: "prod_UC8hgE8GHk3Jz2",
    priceId: "price_1TDkQ9AEIVQtquY2C4kfHe4d",
    price: 4.99,
    features: ["see_likes", "super_likes"],
  },
  {
    name: "Premium",
    tier: "premium",
    productId: "prod_TyazHeNgEAjKEg",
    priceId: "price_1TDjjHQL8g2unk5Zfe9VvytG",
    price: 9.99,
    features: ["see_likes", "super_likes", "priority_visibility", "advanced_filters"],
    highlight: true,
  },
  {
    name: "VIP",
    tier: "vip",
    productId: "prod_UC8igDQOTInDei",
    priceId: "price_1TDkQpAEIVQtquY2s6feqEgV",
    price: 19.99,
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

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  see_likes: "See Who Likes You",
  super_likes: "5 Super Likes/day",
  priority_visibility: "Priority Visibility",
  advanced_filters: "Advanced Filters",
  profile_boost: "1 Profile Boost/mo",
  unlimited_super_likes: "Unlimited Super Likes",
  mentor_badge: "Mentor Badge",
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

export function getTierByProductId(productId: string): SubscriptionTier {
  const tier = SUBSCRIPTION_TIERS.find((t) => t.productId === productId);
  return tier?.tier ?? "free";
}

export function getTierConfig(tier: SubscriptionTier) {
  return SUBSCRIPTION_TIERS.find((t) => t.tier === tier);
}

export function tierHasFeature(tier: SubscriptionTier, feature: FeatureKey): boolean {
  if (tier === "free") return false;
  const config = getTierConfig(tier);
  return config?.features.includes(feature) ?? false;
}
