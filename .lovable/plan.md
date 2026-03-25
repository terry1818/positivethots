

## Plan: Align Discovery Content to Card Width

### Problem
On desktop, the `CompactProgressBar`, `NearbyUsers`, and empty-state cards stretch to `max-w-7xl` (1280px) while the swipe card stack is naturally ~384px (`max-w-sm`), creating a visual mismatch.

### Changes — all in `src/pages/Index.tsx`

**1. Constrain content wrappers below the header**

Three `container max-w-7xl` wrappers become `max-w-sm`:

| Line | Current | New |
|------|---------|-----|
| 488 | `container max-w-7xl mx-auto px-4 py-3` | `max-w-sm mx-auto px-4 py-3` |
| 495 | `container max-w-7xl mx-auto px-4 mb-4` | `max-w-sm mx-auto px-4 mb-4` |
| 501 | `container max-w-7xl mx-auto px-4` | `max-w-sm mx-auto px-4` |

Drop the `container` class (it sets its own max-widths that conflict).

**2. Empty-state cards constrained**

Lines 505 and 519: add `max-w-sm mx-auto w-full` to the two `<Card>` wrappers so they don't exceed the column width on wider viewports. The inner buttons already have `max-w-xs mx-auto` which is fine.

**3. Card stack — already centered**

Line 536 already has `flex justify-center items-start` — no change needed.

### Not Changed
- Sticky header (keeps `max-w-7xl`)
- BottomNav, MatchModal, ProfileDetailSheet
- No component files modified

### Technical Detail
Only className strings on 5 elements in `src/pages/Index.tsx` are edited. No logic, props, or imports change.

