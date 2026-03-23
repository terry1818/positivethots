

# Fix: Discovery showing already-swiped profiles

## Problem
The Discovery page does not exclude profiles the user has already swiped on. It only filters out matched and blocked users. This means:
1. Previously swiped profiles keep appearing in the feed
2. Clicking "Connect" tries to insert a duplicate swipe, which fails due to the unique constraint on `(swiper_id, swiped_id)`
3. The error is caught silently (`console.error` + `return`), so the user sees nothing happen

## Fix

**File: `src/pages/Index.tsx` — `loadSuggestions` function**

Add a query to fetch all existing swipes by the current user, then include those swiped user IDs in the `excludeIds` array.

```text
Current flow:
  1. Fetch matches → exclude matched users
  2. Fetch blocked → exclude blocked users
  3. Fetch discovery profiles excluding above

Fixed flow:
  1. Fetch matches → exclude matched users
  2. Fetch blocked → exclude blocked users
  3. Fetch swipes by current user → exclude already-swiped users
  4. Fetch discovery profiles excluding all above
```

Specifically:
- Add a third parallel query in `loadSuggestions`: `supabase.from("swipes").select("swiped_id").eq("swiper_id", userId)`
- Merge the resulting `swiped_id` values into the `excludeIds` array
- This ensures only fresh, un-swiped profiles appear in Discovery

**Secondary improvement:** Add user-facing error feedback if the swipe insert fails (instead of silent `console.error`), so if edge cases still occur, the user gets a toast notification.

