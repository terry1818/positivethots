

# Fix 3 Security Vulnerabilities

## 1. Profile Boost Payment Bypass (ERROR)

**Problem**: Visiting `/profile?boost=activated` gives any user a free boost via direct DB insert.

**Fix**:
- **`src/pages/Profile.tsx`**: Remove the `?boost=activated` URL param handler (lines 42-46) and the `handleActivateBoost` function. Replace with a simple success toast when `?boost=success` is in the URL. The webhook already inserts the boost row server-side.
- **`supabase/functions/create-boost-payment/index.ts`**: Change `success_url` from `/profile?boost=activated` to `/profile?boost=success`.
- **`src/pages/Profile.tsx` — VIP free boost**: Replace the direct `supabase.from("profile_boosts").insert(...)` call with a new RPC `activate_vip_boost` that validates VIP subscription server-side before inserting.
- **Database migration**: 
  1. Remove the `Users can insert own boosts` RLS INSERT policy on `profile_boosts`
  2. Create a `SECURITY DEFINER` RPC `activate_vip_boost` that checks the user has an active VIP subscription and hasn't used their monthly boost before inserting

## 2. Checkout Arbitrary Price ID (WARN)

**Problem**: `create-checkout` passes any client-supplied `price_id` to Stripe.

**Fix — `supabase/functions/create-checkout/index.ts`**:
- Add a server-side allowlist of valid subscription price IDs
- Reject any `price_id` not in the set

```ts
const ALLOWED_PRICES = new Set([
  'price_1TDkQ9AEIVQtquY2C4kfHe4d', // Plus
  'price_1TDjjHQL8g2unk5Zfe9VvytG', // Premium
  'price_1TDkQpAEIVQtquY2s6feqEgV', // VIP
]);
if (!ALLOWED_PRICES.has(price_id)) throw new Error("Invalid price_id");
```

## 3. Quiz Answer Enumeration (WARN)

**Problem**: `validate_quiz_answer` RPC can be called per-option to find correct answers before submitting.

**Fix — `src/pages/LearnModule.tsx`**:
- Remove the `supabase.rpc("validate_quiz_answer", ...)` call
- Instead, store answers locally without immediate feedback
- After the user submits all answers via `submit_quiz`, show per-question results from the response (which already returns `correct` count)
- Show correct/incorrect feedback post-submission only

This means during the quiz, the user selects answers without knowing if they're right until they submit. The `submit_quiz` RPC already validates server-side and returns the score.

## Files to modify
- `src/pages/Profile.tsx` — remove boost bypass, use RPC for VIP boost
- `supabase/functions/create-boost-payment/index.ts` — change success_url
- `supabase/functions/create-checkout/index.ts` — add price allowlist
- `src/pages/LearnModule.tsx` — remove `validate_quiz_answer` usage, defer feedback to post-submit
- Database migration — drop boost INSERT policy, create `activate_vip_boost` RPC

