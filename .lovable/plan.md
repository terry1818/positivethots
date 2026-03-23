

# Unified Promo Code System (Gift + Referral)

## Key Design Decisions

1. **Single code table** — gift codes and referral codes are the same system. Every code is a row in `promo_codes`.
2. **Stripe trial subscriptions** — redeeming a code creates a Stripe checkout session with a free trial period. Users enter payment info upfront. If they don't cancel, it auto-renews at the configured tier's price when the trial ends.
3. **Referral reward** — when a referred friend's trial converts to a paid subscription (or they pay from the start), the referrer gets a 3-month free trial of Premium via the same promo code system (auto-generated, auto-redeemed).

## Database

**New table: `promo_codes`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| code | text | Unique, 8-char alphanumeric |
| type | text | `gift` or `referral` |
| tier | text | plus / premium / vip (for gift codes) |
| trial_days | integer | e.g. 7, 14, 30 |
| created_by | uuid | User who created it |
| redeemed_by | uuid | Nullable |
| redeemed_at | timestamptz | Nullable |
| referred_subscribed | boolean | Default false (referral tracking) |
| reward_granted | boolean | Default false (referral reward tracking) |
| created_at | timestamptz | Default now() |

**RLS:**
- Authenticated INSERT where `created_by = auth.uid()`
- Authenticated SELECT where `created_by = auth.uid()` OR `redeemed_by = auth.uid()`
- No client UPDATE/DELETE (managed by RPCs and webhook)

## Edge Function Changes

### New: `redeem-promo-code`
Edge function (not an RPC, because it needs Stripe):
1. Validates code exists and is unredeemed
2. Checks user hasn't already redeemed a promo code
3. For **gift** codes: creates a Stripe checkout session with `subscription_data.trial_period_days` set to the code's `trial_days`, at the code's tier price. Returns checkout URL.
4. For **referral** codes: creates a Stripe checkout session with a trial period (e.g. 14 days) at Premium tier price. Records the referral link (sets `redeemed_by`). Returns checkout URL.
5. Marks code as redeemed (`redeemed_by`, `redeemed_at`) only after checkout session is created.

### Update: `stripe-webhook`
After processing `checkout.session.completed` or `customer.subscription.created`:
- Check if the subscribing user has a `referral`-type promo code where they are `redeemed_by`
- If found and `referred_subscribed = false`, set `referred_subscribed = true`
- Auto-generate a new gift promo code for the referrer: 3 months (90 days), Premium tier, auto-redeemed to the referrer
- Create a Stripe checkout session with 90-day trial for the referrer (or directly create a subscription with trial via Stripe API using the referrer's existing customer ID)

### Update: `check-subscription`
No changes needed — once the user has a Stripe subscription (even with trial), the existing logic already detects it and returns `subscribed: true`.

## Frontend Changes

### `src/pages/Premium.tsx`
- Add "Have a promo code?" section with text input + "Redeem" button
- Calls `redeem-promo-code` edge function
- On success, redirects to the returned Stripe checkout URL (which has the trial pre-applied)

### `src/pages/Settings.tsx`
- **Create Promo Codes** section: user picks type (gift or referral), tier (for gift), duration (for gift), generates code, copy/share
- For referral: generates a single permanent referral code per user (type=referral, no tier needed since it gives trial at any tier they choose at checkout... actually referral gives a standard trial)
- **My Codes** list: shows created codes and their redemption status
- **Referral Stats**: shows how many friends signed up, who converted, rewards earned

### `src/pages/Auth.tsx`
- Accept `?ref=CODE` query param
- Store in sessionStorage so it persists through signup flow
- After successful signup, auto-navigate to Premium page with the code pre-filled

## Flow Summary

```text
GIFT CODE FLOW:
User A creates gift code "GIFT1234" (tier=premium, 14 days)
  → shares with Friend B
  → Friend B enters code on Premium page
  → redeem-promo-code creates Stripe checkout with 14-day trial at $9.99/mo
  → Friend B enters payment details, starts trial
  → After 14 days: auto-charges $9.99/mo unless cancelled

REFERRAL FLOW:
User A generates referral code "REF5678"
  → shares link: positivethots.lovable.app/auth?ref=REF5678
  → Friend B signs up, code stored in session
  → Friend B subscribes to any plan (with or without trial)
  → stripe-webhook detects referral, grants User A 90-day Premium trial
  → User A gets Stripe subscription with 90-day free trial, auto-renews at $9.99/mo
```

## Files to Create/Edit
- **New migration** — `promo_codes` table + RLS policies
- **New edge function** — `supabase/functions/redeem-promo-code/index.ts`
- **`supabase/functions/stripe-webhook/index.ts`** — referral reward logic
- **`src/pages/Premium.tsx`** — redeem code UI
- **`src/pages/Settings.tsx`** — create/manage codes + referral stats
- **`src/pages/Auth.tsx`** — capture `?ref=` param

## Security
- Code redemption validated server-side in edge function
- One redemption per code, one gift redemption per account
- Self-referral prevented (referrer_id != redeemed_by)
- Payment details collected upfront via Stripe checkout
- Referral rewards processed only in webhook (server-side, signature-verified)

