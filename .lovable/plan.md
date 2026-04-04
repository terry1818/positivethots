

## Plan: Fix Discovery Page Layout — Buttons Cut Off + Desktop Keyboard Hints

### Changes

#### 1. `src/components/discovery/SwipeDiscoveryCard.tsx`
- Move action buttons from `absolute bottom-[-70px]` into the normal document flow — place them as a regular `flex justify-center` div with `py-4` below the card's `rounded-3xl` container
- This eliminates the need for extra bottom padding in the parent

#### 2. `src/pages/Index.tsx`
- Remove `pb-32` from the card container (no longer needed)
- Reduce `minHeight` from `520px` to `420px`
- Change keyboard hints from `hidden md:flex` to `hidden xl:flex` — they'll only appear on screens ≥1280px where there's room, staying hidden on mobile and mid-size screens

### Files Changed

| File | Change |
|------|--------|
| `src/components/discovery/SwipeDiscoveryCard.tsx` | Move action buttons into card flow |
| `src/pages/Index.tsx` | Remove `pb-32`, reduce minHeight, keyboard hints `xl:flex` only |

