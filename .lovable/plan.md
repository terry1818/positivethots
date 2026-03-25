

## Plan: Rebuild Discovery as Swipe Stack

### Overview
Replace the Discovery grid with a Tinder-style single-card swipe stack. Create two new components, modify Index.tsx rendering.

### Files to Create

**1. `src/components/discovery/SwipeDiscoveryCard.tsx`** (new)

Full swipe card for the discovery stack. Ports drag mechanics from SwipeCard.tsx but adapted for EnhancedProfile.

- Props: `profile, isTop, stackIndex (0-2), onConnect, onPass, onSuperLike, canSuperLike, superLikeBalance, onViewProfile`
- **Stack positioning**: stackIndex 0 = full size z-30, 1 = scale-[0.94] translate-y-3 z-20, 2 = scale-[0.88] translate-y-6 z-10. Behind cards get `pointerEvents: "none"`.
- **Drag mechanics**: Identical to SwipeCard.tsx — `dragStart`, `dragOffset`, `isDragging`, `animate` state. Mouse + touch handlers. Threshold 100px. Rotation = `dragOffset.x / 20`. On threshold exceeded: set `animate` direction, call `onConnect`/`onPass` after 400ms.
- **LIKE/NOPE overlays**: Green "LIKE" top-left (opacity tied to positive drag), red "NOPE" top-right (opacity tied to negative drag). Only visible during drag.
- **Photo cycling**: `photoIndex` state, reset on `profile.id` change. `photos = [profile.profile_image, ...(profile.photos || [])].filter(Boolean)`. Dot indicators top-center (max 6 dots, active = w-4 white, inactive = w-2 white/40). Tap zones: left 1/3 prev, right 2/3 next — both use `e.stopPropagation()` to avoid triggering drag.
- **Card layout**: h-96 photo area with gradient overlay. Over photo bottom: name, age, pronouns, compatibility badge top-right, boosted/verified badges top-left. Below photo: bio (2 lines), compatibility reasons (max 2), tappable "tap for full profile" hint calling `onViewProfile`.
- **Action buttons**: Positioned absolute bottom-[-70px] centered. Pass (36x36 rounded-full outline destructive border), Super Like (30x30 outline amber, conditional), Connect (46x46 filled gradient). Only respond when `isTop`.

**2. `src/components/discovery/ProfileDetailSheet.tsx`** (new)

Bottom sheet using Drawer (from vaul, already installed). Opens when `detailProfile` is set.

- Props: `profile (EnhancedProfile | null), onClose, onConnect, onPass, onSuperLike, canSuperLike`
- Content: Photo carousel (h-56, same dot+tap logic), name/age/verified, compatibility Progress bar with percentage, compatibility reasons list, education badge count display (badge_count number + "Verified Educator" if >= 20), full bio, relationship style badge, looking_for, interests tags.
- Sticky bottom action bar: Pass (outline destructive), Super Like (outline amber, conditional), Connect (filled primary). Each calls its action + onClose.
- Open state controlled by `!!profile`.

### File to Modify

**3. `src/pages/Index.tsx`**

- Add `detailProfile` state: `useState<EnhancedProfile | null>(null)`
- Import `SwipeDiscoveryCard` and `ProfileDetailSheet`
- Replace lines 530-544 (the grid rendering block) with the swipe stack container:
  - `relative flex justify-center items-start px-4 pt-2 pb-32` with `minHeight: 520px`
  - Render `suggestions.slice(0, 3).map(...)` as `SwipeDiscoveryCard` components
- Keep the empty state (boost + referral cards) at lines 498-529 unchanged
- Keep previewMode, loading skeleton, header, CompactProgressBar, NearbyUsers, MatchModal, BottomNav all unchanged
- Add `<ProfileDetailSheet>` before `<BottomNav>`, wired to `detailProfile` state with action handlers that also clear `detailProfile`

### Not Changed
- `SwipeCard.tsx` — untouched
- `DiscoveryCard.tsx` — untouched
- All Supabase queries, RPC calls, handleConnect/handlePass/handleSuperLike logic
- Preview mode, empty state, header, CompactProgressBar, NearbyUsers, MatchModal, BottomNav
- calculateCompatibility / calculateCompatibilityReasons functions

### Files Summary

| File | Action |
|------|--------|
| `src/components/discovery/SwipeDiscoveryCard.tsx` | Create |
| `src/components/discovery/ProfileDetailSheet.tsx` | Create |
| `src/pages/Index.tsx` | Modify grid → stack, add detail sheet |

