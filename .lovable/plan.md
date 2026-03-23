

# Plan: Sticky Bottom Nav, Feature Unlocks on Index, and BDSMtest Integration

## 1. Make BottomNav Sticky (Fixed to Bottom)

**Problem**: BottomNav scrolls with page content, forcing users to scroll past all profiles to reach navigation.

**Fix**: Change `BottomNav` from static to `fixed bottom-0` positioning, and add bottom padding to all pages that use it.

**Changes**:
- `src/components/BottomNav.tsx` — add `fixed bottom-0 left-0 right-0 z-50` classes to the nav element
- All 7 pages using BottomNav (Index, Learn, Messages, LikesYou, Profile, Shop, Resources) — change `pb-20` to ensure content isn't hidden behind the fixed nav. Most already have this but need verification.

---

## 2. Add Feature Unlock Roadmap to Discovery Page (Index)

**Problem**: The Index/Discovery page doesn't show users what features they unlock by completing education tiers.

**Fix**: Import the existing `TierRoadmap` component and `useFeatureUnlocks` hook into `Index.tsx`, and render it below the stats bar / education reminder section.

**Changes**:
- `src/pages/Index.tsx` — import `useFeatureUnlocks` and `TierRoadmap`, add the roadmap card between the education reminder and the matches grid.

---

## 3. BDSMtest.org Integration (Link + Screenshot)

**Problem**: Users want to share their BDSMtest.org results on their profile.

**Approach**: Since BDSMtest.org has no public API, users will:
1. Paste their results URL (e.g., `https://bdsmtest.org/r/abc123`)
2. Optionally upload a screenshot of their results

**Changes**:

**Database**:
- Add `bdsm_test_url` (text, nullable) and `bdsm_test_screenshot` (text, nullable) columns to the `profiles` table via migration.

**Edit Profile** (`src/pages/EditProfile.tsx`):
- Add a new "Kink Profile" card section with:
  - URL input field for the BDSMtest.org results link (validated to match `bdsmtest.org` domain)
  - Screenshot upload button (uploads to `user-photos` bucket, stores URL in `bdsm_test_screenshot`)
- Save both fields with the existing profile save flow.

**Profile Display** (`src/pages/Profile.tsx`):
- Show a "Kink Profile" section if either URL or screenshot is set
- Render the URL as a clickable external link
- Display the screenshot as a viewable image

**Discovery Card** (`src/components/discovery/DiscoveryCard.tsx` and `src/components/ProfileCard.tsx`):
- Show a small badge/icon if the user has BDSM test results linked, so potential matches can see it at a glance.

---

## Technical Details

- The `BottomNav` fix uses `fixed` positioning with `z-50` to stay above all content. Safe-area insets are already handled by the viewport meta tag.
- BDSMtest URL validation uses a simple regex: `/^https?:\/\/(www\.)?bdsmtest\.org\/r\//`
- Screenshot upload reuses the existing `user-photos` storage bucket (already public).
- No new edge functions needed — all changes are client-side + one DB migration.

