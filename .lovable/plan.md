

## Plan: Fix Profile Photo Display

### Problem
The Profile page hero area has a broken thumbnail strip rendered *inside* the `relative h-64` container, causing layout overlap. No carousel state or navigation exists.

### Changes

**File: `src/pages/Profile.tsx`**

1. **Add carousel state** — `currentPhotoIndex` (useState, reset to 0 when `userPhotos` changes via useEffect) and `hasPendingPhotos` (boolean state).

2. **Query pending photo count** in `loadProfile` — add a separate `select("id", { count: "exact", head: true })` query filtered to `moderation_status = "pending"` and set `hasPendingPhotos`.

3. **Replace the hero div** (lines 153–206) with the full carousel structure from the prompt:
   - `h-72` container with `overflow-hidden`
   - Current photo display using `userPhotos[currentPhotoIndex]?.photo_url` with `profile_image` fallback
   - Left-third / right-two-thirds tap zones for prev/next
   - Dot indicators at top center (active dot wider + white, inactive narrow + translucent)
   - Photo count badge top-right (`1/N`)
   - Education badges overlay top-left (unchanged)
   - Name/location overlay bottom (unchanged)
   - **Remove** the old thumbnail strip entirely

4. **Add pending photos message** — below the hero div, show "Photos pending review" text only when `userPhotos.length === 0 && hasPendingPhotos`.

**File: `src/components/ProfileCard.tsx`**

5. **No changes needed** — `ProfileCard` is used in Discovery/Matches and only shows a single `profile_image`. It doesn't load `user_photos` and doesn't have the broken thumbnail issue. Adding a full carousel to a card grid component would be inappropriate — it's a summary card, not a detail view.

### Files Modified
| File | Change |
|------|--------|
| `src/pages/Profile.tsx` | Add carousel state, pending photo query, replace hero with carousel, add pending message |

### Not Changed
PhotoUploadGrid, EditProfile, ProfileCard, badge logic, XP system, subscriptions, photo upload/moderation flow.

