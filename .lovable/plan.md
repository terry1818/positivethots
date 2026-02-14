

# Add "Likes You" Section with Paywall

## Overview

Add a new "Likes You" page accessible from the bottom navigation that shows blurred previews of people who have liked you. Tapping to reveal requires an active premium subscription, powered by Stripe.

## What You'll See

- A new "Likes" tab in the bottom navigation (between Discover and Learn)
- A count badge showing how many people have liked you
- Blurred profile cards of people who liked you
- A prominent "Unlock" button that takes you to a paywall screen
- After subscribing, the cards unblur and you can connect or pass on each person

## Implementation Steps

### 1. Database Changes

**New table: `subscriptions`**
- `id` (uuid, primary key)
- `user_id` (uuid, not null)
- `stripe_customer_id` (text)
- `stripe_subscription_id` (text)
- `status` (text: active, canceled, past_due, etc.)
- `plan` (text, default 'premium')
- `current_period_end` (timestamptz)
- `created_at` / `updated_at`
- RLS: users can only read their own subscription

**New RLS policy on `swipes` table**
- Add a SELECT policy so users can see swipes where `swiped_id = auth.uid()` and `direction = 'right'` -- this lets users know they've been liked (needed for the count badge and the reveal feature)

### 2. Enable Stripe

- Use the Stripe integration to handle subscription payments
- Create a "Premium" product with a monthly price
- Build a checkout flow via a backend function that creates a Stripe Checkout Session
- Build a webhook handler to update the `subscriptions` table when payment succeeds or subscription changes

### 3. New Pages and Components

**`src/pages/LikesYou.tsx`** -- The main "Likes You" page:
- Fetches swipes where `swiped_id = current_user` and `direction = 'right'`
- Excludes users already matched with
- Checks the user's subscription status
- If not subscribed: shows blurred cards with a lock overlay and "Unlock Premium" CTA
- If subscribed: shows full profile cards with Connect/Pass buttons

**`src/pages/Premium.tsx`** -- The paywall/upgrade page:
- Shows premium benefits (see who likes you, etc.)
- Price display
- "Subscribe" button that initiates Stripe Checkout
- Success/cancel return handling

**`src/hooks/useSubscription.ts`** -- Reusable hook:
- Queries the `subscriptions` table for the current user
- Returns `{ isPremium, subscription, loading }`

### 4. Navigation Update

**`src/components/BottomNav.tsx`**:
- Add a "Likes" tab with a Heart icon between Discover and Learn
- Show a notification badge with the count of pending likes

**`src/App.tsx`**:
- Add routes for `/likes` and `/premium`

### 5. Backend Functions

**`supabase/functions/create-checkout/index.ts`**:
- Creates a Stripe Checkout Session for the premium subscription
- Returns the checkout URL to redirect the user

**`supabase/functions/stripe-webhook/index.ts`**:
- Handles Stripe webhook events (checkout.session.completed, customer.subscription.updated/deleted)
- Updates the `subscriptions` table accordingly

## Technical Details

### Swipes RLS Update

```sql
CREATE POLICY "Users can see who liked them"
  ON public.swipes FOR SELECT
  USING (swiped_id = auth.uid() AND direction = 'right');
```

### Blurred Card Approach

Cards for non-premium users will use CSS `filter: blur(20px)` on the profile image and name, with a lock icon overlay and "Upgrade to see" text. The count of likes will always be visible (as a teaser).

### Files Changed/Created

| File | Action |
|------|--------|
| `subscriptions` table | Create via migration |
| `swipes` RLS policy | Add new SELECT policy |
| `src/pages/LikesYou.tsx` | Create |
| `src/pages/Premium.tsx` | Create |
| `src/hooks/useSubscription.ts` | Create |
| `src/components/BottomNav.tsx` | Update (add Likes tab) |
| `src/App.tsx` | Update (add routes) |
| `supabase/functions/create-checkout/index.ts` | Create |
| `supabase/functions/stripe-webhook/index.ts` | Create |

