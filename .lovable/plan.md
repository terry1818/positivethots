

# Combine Tier Dropdowns + Feature Roadmap into One Section

## Problem
The Learn page currently has three separate sections stacked vertically:
1. "Your Progress" card (overall progress bar + badge count)
2. "Feature Roadmap" card (TierRoadmap component showing tier progress + feature pills)
3. Tiered module collapsibles (the actual module lists grouped by tier)

This is redundant — tiers appear twice (roadmap AND collapsibles), making the page long and cluttered.

## Solution
Merge all three into a single unified section. Each tier becomes one collapsible that shows:
- **Header row**: Tier name, progress count, completion check, feature unlock pills (inline), chevron
- **Expanded content**: The module cards (existing)

Remove the separate "Your Progress" card and "TierRoadmap" component from the page entirely. The overall progress info (badge count, progress bar) moves into a compact summary above the tier list.

## Changes

**File: `src/pages/Learn.tsx`**

1. Remove the "Your Progress" `<Card>` block (lines 168-191)
2. Remove the `<TierRoadmap>` usage (line 194) and its import
3. Replace the existing tiered modules section with a unified section that:
   - Has a small header: "Learning Path" with overall badge count
   - Shows a thin overall progress bar
   - Below that, each tier collapsible header now includes the feature unlock pills from TierRoadmap (pulled from the `tiers` array by matching tier key)
   - Expanded content remains the same module cards

**Tier header layout (combined):**
```text
[Foundation (Required)  3/5  ✓]  [🔍 Discovery] [📍 Location]  ▼
```
- Left: tier label + count + completion icon
- Middle: feature pills (from `tiers[].features`) shown inline
- Right: chevron

This keeps all the information but in one cohesive, scannable section instead of three.

**File: `src/components/education/TierRoadmap.tsx`** — No changes needed (can be kept for use on Discovery page's CompactProgressBar, but removed from Learn page import)

