

## Plan: Fix Blank Photos, Main Photo Selection, and Smart Photo Ordering

### Problem Summary
1. Discovery cards show blank space when `profile_image` URL is broken (e.g., zwickedsexy's first photo)
2. Users cannot choose which photo is their main profile photo — it's always the first by order
3. No system to help users identify their best-performing photos

### Changes

#### 1. Fix blank photos in Discovery — skip broken URLs
**Files:** `src/components/discovery/SwipeDiscoveryCard.tsx`, `src/components/discovery/ProfileDetailSheet.tsx`

- In `SwipeDiscoveryCard`, add `useState` to track which photo URLs have errored (`failedPhotos` Set)
- Filter out failed URLs from the `photos` array so the card auto-advances to the next working photo
- Pass `onError` prop to the `BlurImage` component that adds the failed URL to the set
- If ALL photos fail, show the initial-letter gradient fallback (already exists)
- Apply the same pattern in `ProfileDetailSheet` for the expanded profile view

The key fix: instead of `const photos = [profile.profile_image, ...(profile.photos || [])].filter(Boolean)`, compute a `validPhotos` array that also excludes URLs in `failedPhotos`. When a photo errors, it gets added to `failedPhotos`, which re-renders and auto-skips to the next valid photo.

#### 2. "Set as Main Photo" button in PhotoUploadGrid
**File:** `src/components/PhotoUploadGrid.tsx`

- Add a "Set as Main" button (star icon) on each public approved photo that isn't already the first photo
- When tapped: reorder that photo to `order_index: 0`, shift others up, update `profiles.profile_image` to the selected photo's URL
- Update the description text: "Tap ⭐ on any photo to set it as your main profile photo. Drag to reorder."

#### 3. Smart Photo Ordering — "Best Photo" insights
**Database:** New table `photo_performance` to track engagement metrics per photo.

Schema:
```sql
CREATE TABLE public.photo_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES user_photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  impressions integer NOT NULL DEFAULT 0,
  right_swipes integer NOT NULL DEFAULT 0,
  left_swipes integer NOT NULL DEFAULT 0,
  super_likes integer NOT NULL DEFAULT 0,
  score numeric NOT NULL DEFAULT 0,
  period_start date NOT NULL DEFAULT CURRENT_DATE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(photo_id, period_start)
);
ALTER TABLE public.photo_performance ENABLE ROW LEVEL SECURITY;
-- Users can read own stats
CREATE POLICY "Users can read own photo stats" ON public.photo_performance FOR SELECT TO authenticated USING (auth.uid() = user_id);
```

**Tracking (in `src/pages/Index.tsx`):**
- When a user swipes right/left/super-like on a profile, record which photo was visible (the `photoIndex` at swipe time) by inserting/updating `photo_performance` for that photo
- This requires passing the current visible photo info back up from `SwipeDiscoveryCard`

**Display (in `src/components/PhotoUploadGrid.tsx`):**
- Fetch `photo_performance` for the user's photos
- Show a small badge on each photo: "🔥 Best" on the highest-scoring photo, or a subtle performance bar
- Add a "Smart Order" button that auto-reorders photos by performance score (best first)
- Show tooltip: "Based on how others engage with your photos"

#### 4. Discovery photo enrichment fix
**File:** `src/pages/Index.tsx`

Current logic at line 257-258 has a bug: it only uses `photosByUser` as fallback when `profile_image` is null or `photos` array is empty. But `profile_image` can be a broken URL (non-null string that 404s).

Fix: Always prefer `photosByUser` (approved photos from `user_photos` table) as the primary source. Only fall back to `profile_image`/`photos` columns if no approved photos exist:
```typescript
profile_image: photosByUser.get(p.id)?.[0] || p.profile_image || null,
photos: photosByUser.get(p.id)?.slice(1) || p.photos || null,
```

### Technical Details

- **Photo error handling pattern:** Uses React state (`Set<string>`) to track failed URLs. `BlurImage` already supports `onError` prop. When error fires, URL is added to set, component re-renders, failed URL is filtered from the computed `validPhotos` array, and `photoIndex` is clamped to valid range.

- **Performance tracking:** Lightweight — only increments counters. Score formula: `(right_swipes + super_likes * 3) / max(impressions, 1) * 100`. Updated via upsert on each swipe action.

- **RLS:** `photo_performance` only readable by the photo owner. Insertable by authenticated users (for tracking others' engagement on your photos, done via a security-definer function to avoid exposing other users' data).

### File Summary
| File | Change |
|------|--------|
| `src/components/discovery/SwipeDiscoveryCard.tsx` | Add failed photo tracking, auto-skip broken photos, expose visible photo index |
| `src/components/discovery/ProfileDetailSheet.tsx` | Same failed photo tracking pattern |
| `src/components/PhotoUploadGrid.tsx` | "Set as Main" button, "Smart Order" button, performance badges |
| `src/pages/Index.tsx` | Fix photo enrichment priority, track photo impressions/swipes |
| Migration | New `photo_performance` table |

