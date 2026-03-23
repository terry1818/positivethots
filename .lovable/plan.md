

# Plan: Profile Upsell Card + Compact Discovery Header

## Part 1: Premium Upsell Card on Profile Page

**File:** `src/pages/Profile.tsx`

Add a "Go Premium" card for free-tier users between the Unlocked Features and Boost sections:
- Gradient background with `Crown` icon
- 3 bullet points: "See who likes you", "Unlimited Super Likes", "Priority Visibility"
- "View Plans" button → `navigate("/premium")`
- Only renders when `tier === "free"` (uses existing `useSubscription` hook)

## Part 2: Compact Discovery Page Header

**Problem:** The TierRoadmap component renders every tier as a full card with progress bars and feature pills — taking up 400+ px of vertical space before users see any profiles.

**Solution:** Replace the full `TierRoadmap` on the Discovery page with a single-row compact progress strip, and merge the 3-card stats bar + education reminder into one streamlined section.

### Changes to `src/pages/Index.tsx`:

1. **Remove** the full `<TierRoadmap>` component from the Discovery page (lines 370-375)
2. **Replace the 3-card stats grid** (lines 330-350) + education reminder (lines 352-368) + tier roadmap (lines 370-375) with a **single compact bar**:
   - One horizontal row showing: `{suggestions.length} matches` · `{userBadgeCount} badges` · `{completedTiers}/{totalTiers} tiers` · optional "Learn →" link
   - A single thin multi-segment progress bar showing overall tier completion
   - Clicking the bar navigates to `/learn` where the full roadmap lives

### New component: `src/components/discovery/CompactProgressBar.tsx`

A slim, single-row component that takes `tiers`, `badgeCount`, and `suggestionCount` as props:
- Renders a horizontal flex row with key stats as small badges/text
- Below: a thin segmented progress bar (one colored segment per tier, proportional width)
- Total height: ~60-70px instead of ~500px+
- Tappable → navigates to `/learn`

### What stays:
- Header with Logo, Boost, Incognito, Settings buttons (unchanged)
- Nearby Users section (unchanged)
- Curated Matches Grid (unchanged, now visible much sooner)

## Files to modify
- `src/pages/Profile.tsx` — add premium upsell card
- `src/pages/Index.tsx` — replace stats grid + education reminder + TierRoadmap with compact bar
- `src/components/discovery/CompactProgressBar.tsx` — new compact component

