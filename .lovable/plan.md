

## Multi-Tier Subscription System

Transform the single $9.99/mo Premium plan into a 3-tier subscription model to capture more revenue across different user segments.

### Tier Structure

| | Plus ($4.99/mo) | Premium ($9.99/mo) | VIP ($19.99/mo) |
|---|---|---|---|
| See Who Likes You | Yes | Yes | Yes |
| 5 Super Likes/day | Yes | Yes | Yes |
| Priority Visibility | — | Yes | Yes |
| Advanced Filters | — | Yes | Yes |
| 1 Profile Boost/mo | — | — | Yes |
| Unlimited Super Likes | — | — | Yes |
| Mentor Badge | — | — | Yes |

### Steps

1. **Create Stripe products and prices** — Use Stripe tools to create "Plus" ($4.99/mo recurring), keep existing "Premium" ($9.99/mo), and create "VIP" ($19.99/mo recurring)

2. **Update `check-subscription` edge function** — Return the `product_id` so the frontend knows which tier the user is on (it already partially does this but the hook doesn't use it)

3. **Update `create-checkout` edge function** — Accept a `price_id` parameter from the frontend so users can select which tier to purchase

4. **Update `useSubscription` hook** — Track `tier` (plus/premium/vip) in addition to `isPremium`, expose helper like `hasFeature(feature)` for gating

5. **Redesign Premium page** — Replace single-price card with a 3-column comparison table showing features per tier, with a "Subscribe" button on each column. Highlight Premium as "Most Popular"

6. **Update `stripe-webhook`** — Store the plan tier in the `subscriptions` table `plan` column (currently hardcoded to "premium")

7. **Update Settings page** — Show current tier name and allow upgrade/downgrade via customer portal

### Technical Details

- Store a `SUBSCRIPTION_TIERS` constant mapping Stripe product IDs to tier names, features, and prices
- The `subscriptions.plan` column already exists and will store "plus", "premium", or "vip"
- No new DB tables needed — the existing `subscriptions` table handles everything
- Customer portal (already implemented) handles upgrades/downgrades/cancellations

### Files changed

| File | Change |
|------|--------|
| `src/lib/subscriptionTiers.ts` | **New** — tier config mapping product IDs to features |
| `src/hooks/useSubscription.ts` | Add `tier` state and `hasFeature()` helper |
| `src/pages/Premium.tsx` | Redesign with 3-tier comparison layout |
| `src/pages/Settings.tsx` | Show tier name instead of just "Premium" |
| `supabase/functions/create-checkout/index.ts` | Accept `price_id` body param |
| `supabase/functions/check-subscription/index.ts` | Return `product_id` (minor tweak) |
| `supabase/functions/stripe-webhook/index.ts` | Map product ID to plan name |

