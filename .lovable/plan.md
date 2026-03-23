

# Gap Analysis: What's Done vs. What's Still Missing

## Completed
- **Feature 5 (Events):** Database tables, `create-event-checkout` edge function, Events page UI, route registered, 25% Stripe coupon created, webhook handles `event_ticket` payments
- **Feature 3 (Super Likes):** New "Super Like Pack (5)" Stripe product created, `create-superlike-payment` updated for both pack sizes, `super_like_purchases` table created, webhook handles `super_like_pack` payments
- **Stripe Webhook:** Updated to handle all one-time payment types (events, super likes, boosts)

## Still Missing — 6 Gaps

### Gap 1: No Boost button on Discovery screen (Feature 1)
The Discovery page (`Index.tsx`) has no "Boost Profile" CTA. Only the Profile page has it.
- **Fix:** Add a small "Boost" button/icon in the Discovery header area (near the super-likes badge) that links to the boost payment flow.

### Gap 2: No free tier feature list on Premium page (Feature 2)
The Premium page only shows Plus/Premium/VIP tiers. No "Free" column showing what free users get.
- **Fix:** Add a "Free" tier column (or a "What you get free" section) before the paid tiers listing basic features like "1 daily super like", "Browse profiles", "Education access".

### Gap 3: No onboarding upsell step (Feature 2)
Onboarding (`Onboarding.tsx`, 12 steps) has no subscription upsell screen.
- **Fix:** Add an optional upsell step near the end of onboarding (before completion) showing tier benefits with a "Try Premium" CTA and a "Skip" option.

### Gap 4: No "Get More Super Likes" prompt when balance hits 0 (Feature 3)
When `superLikeBalance <= 0`, the button just disables. No prompt to purchase more.
- **Fix:** In `DiscoveryCard.tsx`, when balance is 0 and user clicks the super like button, show a toast or modal prompting them to buy a pack with a link to the purchase flow.

### Gap 5: No "Send Gift" email flow (Feature 4)
Settings page has code generation/copying but no way to enter a recipient email and send them a notification.
- **Fix:** Add a "Send Gift" form in Settings with a recipient email field. On submit, generate a gift code and send a notification email to the recipient via the existing email queue infrastructure.

### Gap 6: No Resources section on marketing site (Website)
`public/landing.html` has no Resources section or nav link.
- **Fix:** Add a "Resources" section to `landing.html` with static resource cards (books, podcasts, communities) with affiliate link placeholders, and add a "Resources" nav link.

---

## Implementation Plan

### Step 1: Discovery screen boost button
Add a Zap icon button in the `Index.tsx` header that triggers the existing `create-boost-payment` flow or navigates to `/profile?boost=true`.

### Step 2: Premium page free tier column
Add a "Free" card before the paid tiers in `Premium.tsx` listing basic free features with a "Current Plan" label for free users.

### Step 3: Onboarding upsell step
Add step 13 (or insert before photo upload) in `Onboarding.tsx` with a compact tier comparison and "Try Premium" / "Skip" buttons.

### Step 4: Super Like empty-state prompt
In `DiscoveryCard.tsx`, when balance is 0 and super like is clicked, show a toast with "Out of Super Likes! Get more" linking to the purchase flow. Also add a small "Get More" link below the super like button when balance is low.

### Step 5: Send Gift email flow
Add a "Send a Gift" card in `Settings.tsx` with a recipient email input. Create a simple edge function or use the existing email queue to send a branded email with the gift code and redemption link.

### Step 6: Landing page Resources section
Add a static "Resources" HTML section in `landing.html` with curated resource cards and a nav link.

