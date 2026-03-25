

## Plan: Annual Pricing, VIP Differentiation, Gift on Premium Page, Nav Swap

Covers Prompts 3A, 3B, 3C across 7 files.

---

### 3A: Annual Pricing Options

**`src/lib/subscriptionTiers.ts`**
- Add `billingPeriod: "monthly" | "annual"` to `TierConfig`
- Add `annualMonthlyEquivalent?: number` field for display
- Tag existing 3 tiers with `billingPeriod: "monthly"`
- Add 3 annual tiers with placeholder IDs:
  - Plus Annual: $47.99/yr (`ANNUAL_PLUS_PRICE_ID`), monthlyEquivalent $4.00
  - Premium Annual: $95.99/yr (`ANNUAL_PREMIUM_PRICE_ID`), monthlyEquivalent $8.00
  - VIP Annual: $191.99/yr (`ANNUAL_VIP_PRICE_ID`), monthlyEquivalent $16.00
- Add helper exports: `MONTHLY_TIERS`, `ANNUAL_TIERS` (filtered arrays)
- Update `getTierByProductId` to search all tiers

**`src/pages/Premium.tsx`**
- Add `billingPeriod` state ("monthly" | "annual"), default "monthly"
- Add a two-button toggle (Monthly / Annual) between promo code section and Free tier card
- Filter `SUBSCRIPTION_TIERS` by `billingPeriod` for the pricing grid
- For annual cards: show `$X.XX/mo` (the monthly equivalent) as the large price, `Billed $X.XX/year` as subtext, and a "Save 20%" badge
- Footer text updates dynamically: "Billed monthly" vs "Billed annually"

**`supabase/functions/create-checkout/index.ts`**
- Add the 3 annual placeholder price IDs to `ALLOWED_PRICES` set

---

### 3B: VIP Tier Differentiation

**`src/lib/subscriptionTiers.ts`**
- Add `"verified_educator"` and `"community_host"` to `FeatureKey` union
- Add both to VIP features array (monthly and annual)
- Add to `FEATURE_LABELS`: "Verified Educator Badge" and "Host Community Events"
- Add both to `ALL_FEATURES` array

**`src/components/discovery/DiscoveryCard.tsx`**
- Add a "Verified Educator" badge (amber/gold) when `profile.badge_count >= 20` AND profile has VIP tier. Since the card doesn't know the user's tier, we'll key this off `badge_count >= 20` alone (earning 20 badges already implies deep engagement). Display with amber styling distinct from the blue "Verified" badge.

**`src/pages/Profile.tsx`**
- Same logic: if user's `badge_count >= 20`, show "Verified Educator" gold badge on their own profile card

**`src/pages/Premium.tsx`**
- Add a short italicized note under VIP feature list: "VIP is for members who've completed the full curriculum and want to give back to the community."

**`src/pages/Learn.tsx`**
- When `userBadges.length >= 20` (all badges earned), show a callout card: "You've completed the full curriculum! Upgrade to VIP to earn your Verified Educator badge." with a link to `/premium`. Only show if not already VIP.

---

### 3C: Gift Section on Premium & Nav Swap

**`src/pages/Premium.tsx`**
- Add a "Give the Gift of Growth" section below pricing cards. Contains:
  - Gift icon + headline + description
  - Email input, tier dropdown (Plus/Premium/VIP), trial length dropdown (7/14/30 days)
  - "Send Gift" button — replicates the inline gift logic from Settings.tsx (insert `promo_codes` row + invoke `send-transactional-email` with `gift-code` template)
  - Success toast on completion

**`src/components/BottomNav.tsx`**
- Replace `{ path: "/shop", icon: ShoppingBag, label: "Shop" }` with `{ path: "/events", icon: Calendar, label: "Events" }`
- Import `Calendar` from lucide-react, remove `ShoppingBag`

---

### Summary

| # | File | Changes |
|---|------|---------|
| 1 | `src/lib/subscriptionTiers.ts` | Annual tiers, new VIP features, billing period field |
| 2 | `src/pages/Premium.tsx` | Monthly/Annual toggle, annual pricing display, VIP description, Gift section |
| 3 | `supabase/functions/create-checkout/index.ts` | Add annual price IDs to allowlist |
| 4 | `src/components/discovery/DiscoveryCard.tsx` | Verified Educator badge (amber) |
| 5 | `src/pages/Profile.tsx` | Verified Educator badge on own profile |
| 6 | `src/pages/Learn.tsx` | VIP upsell callout after completing all badges |
| 7 | `src/components/BottomNav.tsx` | Shop → Events nav swap |

