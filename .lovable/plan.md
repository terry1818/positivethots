

# Add "Your Likes" Tab to the Likes Page

## What
Add a two-tab layout to `src/pages/LikesYou.tsx`: "Likes You" (default, existing content) and "Your Likes" (new tab showing profiles the user recently swiped right on).

## Changes

**File: `src/pages/LikesYou.tsx`**

1. Import `Tabs, TabsList, TabsTrigger, TabsContent` from `@/components/ui/tabs`
2. Add new state: `sentLikes` (array of profiles), `sentLoading` (boolean)
3. Add a `fetchSentLikes` function that queries `swipes` table where `swiper_id = user.id` and `direction = 'right'`, ordered by `created_at desc`, limit 50. Then joins profile data via a second query to `profiles` using the `swiped_id` values (using `get_public_profile` RPC or direct select depending on RLS — profiles table only allows own profile reads, so we'll use the existing `get_public_profile` RPC or query via the swipes join pattern)
4. Wrap existing page content in `<Tabs defaultValue="likes-you">`:
   - `<TabsList>` with two triggers: "Likes You" and "Your Likes"
   - `<TabsContent value="likes-you">` — all existing likes-you content (unchanged)
   - `<TabsContent value="your-likes">` — grid of profiles the user liked, showing photo/name/age in the same card style, but without accept/reject buttons (just a Heart icon overlay)
5. Fetch sent likes lazily (only when tab is switched to "your-likes") to avoid unnecessary queries

**Data access note:** The `profiles` table RLS only allows users to read their own profile. The existing `get_public_profile` RPC takes a single user ID. For efficiency, we should query `swipes` for the IDs, then batch-fetch profiles. Since there's no batch public profile RPC, we'll create a simple approach: query swipes to get IDs + join with a view or use individual RPC calls. Given the RLS constraint, the cleanest approach is to add a new database function `get_sent_likes` that returns profile data for users the caller has swiped right on.

**New database function (migration):**
```sql
CREATE OR REPLACE FUNCTION public.get_sent_likes(_user_id uuid)
RETURNS TABLE(
  id uuid, name text, age integer, profile_image text, location text, swiped_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.age, p.profile_image, p.location, s.created_at as swiped_at
  FROM swipes s
  JOIN profiles p ON p.id = s.swiped_id
  WHERE s.swiper_id = _user_id AND s.direction = 'right'
  ORDER BY s.created_at DESC
  LIMIT 50;
$$;
```

## Files
- `src/pages/LikesYou.tsx` — add tabs, new tab content, fetch logic
- Database migration — add `get_sent_likes` RPC

