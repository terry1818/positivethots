

## Plan: Fix Discovery Feed + Increase Mascot Size

### Root Cause of Discovery Feed Bug

**The bug is a CSS layout collapse.** On line 826 of `Index.tsx`, each `SwipeDiscoveryCard` is wrapped in `<div className="relative">`. The `SwipeDiscoveryCard` component uses `position: absolute` internally. Since the wrapper div's only child is absolutely positioned (removed from flow), the wrapper collapses to 0x0 pixels. The card then sizes itself relative to this invisible container, resulting in no visible content.

This wrapper was added to support the "Second look" recycled badge overlay. Before this wrapper existed, the cards rendered directly into the outer `relative flex` container and sized correctly.

### Fix

**File: `src/pages/Index.tsx`** (lines 825-849)

Remove the wrapper `<div className="relative">` entirely. Move the "Second look" recycled badge into the `SwipeDiscoveryCard` component by passing `is_recycled` as a prop.

**File: `src/components/discovery/SwipeDiscoveryCard.tsx`**

- Add `is_recycled?: boolean` to the props interface
- Render the "Second look" badge inside the card (within the photo area, using the existing `z-10` badge row) when `isTop && profile.is_recycled`
- This keeps the badge visible without breaking the absolute positioning layout

### Mascot Size Increase (20%)

**File: `src/components/BrandedEmptyState.tsx`**

- Change mascot from `w-[156px] h-[156px]` to `w-[187px] h-[187px]` (156 * 1.2 = 187.2, rounded)

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Remove wrapper div around SwipeDiscoveryCard, pass `is_recycled` prop |
| `src/components/discovery/SwipeDiscoveryCard.tsx` | Accept `is_recycled` prop, render "Second look" badge internally |
| `src/components/BrandedEmptyState.tsx` | Mascot size 156→187px |

