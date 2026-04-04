

## Plan: Viewport-Fit Discovery Layout + Auto-Dismiss Keyboard Hints

### Root Cause

The card container uses `height: calc(100vh - 280px)` but 280px is a rough guess that doesn't account for the variable-height elements above it (header, profile banner, compact progress strip, nearby users). On smaller screens this underestimates, causing overflow. On larger screens the card photo takes 50vh which is too much when combined with card body and action buttons.

The fix is to use flexbox to fill remaining space instead of a hardcoded calc, and make the card + buttons scale to fit within whatever space is available.

### Changes

#### 1. `src/pages/Index.tsx` — Flex-fill layout for card area

- Wrap the main content area (from after header to before bottom nav) in a `flex flex-col` container with `flex-1 overflow-hidden` so it fills the remaining viewport
- Change the card container from `style={{ height: 'calc(100vh - 280px)', minHeight: '340px' }}` to `className="flex-1 relative flex justify-center items-center"` with `overflow-hidden`
- This lets the card area automatically take whatever space remains after header, progress strip, and bottom nav

#### 2. `src/components/discovery/SwipeDiscoveryCard.tsx` — Scale card to fit container

- Change the photo height from `h-[50vh] max-h-96` to `h-[40vh] max-h-80` — shorter photo that leaves room for card body + buttons
- Ensure the outer card wrapper uses `max-h-full` so it can't exceed its container
- Keep action buttons in normal flow (not absolute) with `py-2`

#### 3. `src/pages/Index.tsx` — Auto-dismiss keyboard hints after 7 seconds

- Add a `showKeyboardHints` state, defaulting to `true`
- Add a `useEffect` that sets a 7-second timeout to set `showKeyboardHints` to `false`
- Wrap the keyboard hints div with `{showKeyboardHints && ...}`
- Add a fade-out transition class when dismissing

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Flex-fill layout for card container, keyboard hints auto-dismiss after 7s |
| `src/components/discovery/SwipeDiscoveryCard.tsx` | Photo height `h-[40vh] max-h-80`, card `max-h-full` constraint |

