

## Plan: Viewport-Fit Discovery Card + Always-Visible Thot Button

### Problem

1. **Card + buttons overflow viewport**: The photo area is fixed at `h-96` (384px). Combined with header, progress bar, card body, action buttons, and bottom nav, this exceeds the viewport — buttons get clipped. Per project knowledge: single-purpose screens must fit without scrolling; mobile-first 375px.

2. **"Send a Thot" button hidden**: Only renders when `canSuperLike` is true. Per project knowledge: Hook Model requires Trigger → Action → Variable Reward → Investment. The Thot button is a key investment/upsell trigger and must always be visible. Von Restorff: the Connect button should remain the ONE visually distinct action; the Thot button sits between Pass and Connect as a secondary option.

### Changes

#### 1. `src/components/discovery/SwipeDiscoveryCard.tsx`

**Viewport-responsive photo height:**
- Replace fixed `h-96` on the photo container with `h-[50vh] max-h-96` — shrinks on small viewports, caps at 384px on large ones
- Tighten card body padding from `p-4` to `p-3`, bio from `line-clamp-2` to `line-clamp-1`
- Reduce action button row padding from `py-4` to `py-2`

**Always-visible Thot button:**
- Remove the `{canSuperLike && ...}` conditional wrapper
- Always render the Thot button. When `canSuperLike` is false, apply muted styling (`opacity-60 grayscale`) and add a small Lock icon overlay
- Add `onUpgradeSuperLike?: () => void` prop. When `canSuperLike` is false, clicking calls `onUpgradeSuperLike` instead of `handleSuperLikeTap`
- Touch targets remain 44px+ (Pass=56px, Thot=48px, Connect=64px) per Fitts's Law — primary action largest

#### 2. `src/pages/Index.tsx`

**Viewport-aware container:**
- Change the card container from `style={{ minHeight: '420px' }}` to `style={{ height: 'calc(100vh - 280px)', minHeight: '340px' }}` — fits between header and bottom nav dynamically
- Pass `onUpgradeSuperLike={() => navigate("/premium")}` to `SwipeDiscoveryCard`

### Branded Language Check
- "Send a Thot" — correct (not "Super Like")
- "Connect" — correct (not "Like"/"Swipe Right")
- "Pass" — correct (not "Reject"/"Swipe Left")
- Aria labels use branded terms

### Files Changed

| File | Change |
|------|--------|
| `src/components/discovery/SwipeDiscoveryCard.tsx` | Viewport-responsive photo height, compact spacing, always-visible Thot button with upsell/locked state |
| `src/pages/Index.tsx` | Viewport-aware container height, pass `onUpgradeSuperLike` prop |

