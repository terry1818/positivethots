

# Analysis: Requested Features vs. Existing Implementation

After thorough review of the codebase, Stripe products, and database schema, **most of the requested features already exist**. Here is a detailed breakdown:

---

## Feature 1 — Boost Credits: ALREADY EXISTS

**What's already built:**
- Stripe product: `prod_UC8rptUQyJjuTX` ("Profile Boost", $2.99 one-time)
- Database table: `profile_boosts` (id, user_id, activated_at, expires_at)
- Edge function: `create-boost-payment/index.ts` (creates Stripe checkout)
- Profile page: "Boost Profile" button with VIP free boost logic
- Discovery query: boosted profiles get `is_boosted` flag and sort priority
- Discovery card: shows "Boosted" badge on boosted profiles

**Gaps to fill:**
- No `is_active` computed column (currently uses `expires_at > now()` which is equivalent)
- No boost button on the Discovery/swipe screen itself (only on Profile page)
- The Zap badge exists but could be made more prominent

**Verdict:** ~95% done. Minor UI addition needed (boost button on Discovery screen).

---

## Feature 2 — Plus Tier Subscription: ALREADY EXISTS

**What's already built:**
- Stripe product: `prod_UC8hgE8GHk3Jz2` ("Plus Subscription", $4.99/mo)
- Three-tier system: free / plus / premium / vip defined in `subscriptionTiers.ts`
- `useSubscription` hook returns `tier` and `hasFeature()` for feature gating
- Premium page shows all 3 tiers (Plus $4.99, Premium $9.99, VIP $19.99)
- Feature gates: `see_likes`, `super_likes`, `priority_visibility`, etc.

**Gaps to fill:**
- No subscription upsell during onboarding/profile setup
- No explicit listing of "free tier features" on the Premium page
- Incognito mode feature gate not fully implemented (only mentioned in context)

**Verdict:** ~85% done. Needs onboarding upsell step and free tier feature list.

---

## Feature 3 — Super Like Packs: ALREADY EXISTS

**What's already built:**
- Stripe product: `prod_UC8stYS4Xx9hot` ("Super Like Pack (10)", $1.99)
- Database table: `super_like_balance` (user_id, balance, last_daily_refresh)
- Edge function: `create-superlike-payment/index.ts`
- Hook: `useSuperLikes` with daily refresh, decrement, unlimited for premium
- Super Like button on Discovery cards with balance display

**Gaps to fill:**
- Only one pack size exists (10 for $1.99). Request asks for two: 5 for $1.99 and 10 for $3.99
- No `super_like_purchases` tracking table
- No "Get More Super Likes" prompt when balance hits 0

**Verdict:** ~80% done. Needs second pack option and empty-state prompt.

---

## Feature 4 — Gift Subscriptions: ALREADY EXISTS

**What's already built:**
- Database table: `promo_codes` (code, type, tier, trial_days, created_by, redeemed_by, etc.)
- Edge function: `redeem-promo-code/index.ts` (validates code, creates Stripe checkout with trial)
- Stripe webhook: processes referral rewards (90-day Premium trial for referrer)
- Settings page: full UI for creating gift/referral codes, viewing codes, copying links
- Premium page: "Have a promo code?" redemption input
- Auth page: captures `?ref=CODE` and stores in sessionStorage

**Gaps to fill:**
- No email notification to gift recipient (currently just code sharing)
- Gift codes create trials that auto-renew (already implemented via Stripe checkout)
- No dedicated "Send a Gift" flow with recipient email field

**Verdict:** ~85% done. Needs recipient email flow and email notification.

---

## Feature 5 — Event Tickets / Virtual Workshops: NOT YET BUILT

**What's needed:**
- New Stripe products for events (created per-event, not upfront)
- New tables: `events`, `event_registrations`
- New edge function: `create-event-checkout`
- New page/section: Events browsing UI
- Stripe coupon for 10% Premium discount
- "Add to Calendar" link generation

**Verdict:** 0% done. Full build required.

---

## Website — Resources Section on positivethots.org: NOT YET BUILT

**What exists:**
- `public/landing.html` is the marketing site with nav, hero, features, pricing, footer
- App has a `Resources` page (`src/pages/Resources.tsx`) pulling from `recommended_resources` table

**What's needed:**
- New HTML section/page in `landing.html` for Resources
- Static resource cards with affiliate link placeholders
- Nav link addition

**Verdict:** 0% done. Full build required.

---

## Recommended Implementation Order

Since Features 1-4 are mostly built, I recommend:

1. **Feature 5 — Events** (largest new build, most complex)
2. **Website — Resources** (independent, no backend dependencies)
3. **Gap fills for Features 1-4** (grouped as one pass):
   - Add boost button to Discovery screen
   - Add free tier feature list + onboarding upsell to Premium page
   - Create second Super Like pack (5 for $1.99), update existing to 10 for $3.99
   - Add "Send Gift" email flow with recipient notification

## New Stripe Products Needed

| Product | Type | Price |
|---------|------|-------|
| Super Like Pack (5) | One-time | $1.99 |
| Event-specific products | One-time | Per-event pricing |
| Premium 10% Off coupon | Coupon | 10% off |

The existing Super Like Pack (10) price would need updating from $1.99 to $3.99.

## New Database Tables Needed

| Table | Columns |
|-------|---------|
| `events` | id, title, description, host_name, event_date, price_cents, stripe_price_id, capacity, image_url, is_active, created_at |
| `event_registrations` | id, event_id, user_id, purchased_at, stripe_payment_intent_id |
| `super_like_purchases` | id, user_id, pack_size, purchased_at, stripe_payment_intent_id |

## New Edge Functions Needed

- `create-event-checkout` — one-time payment for event tickets with Premium coupon

## Summary

4 of 6 items are 80-95% already implemented. The two genuinely new builds are Events and the marketing site Resources section. Shall I proceed with this order, or would you prefer a different sequence?

