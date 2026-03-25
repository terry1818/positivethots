

## Plan: Duolingo-Inspired Badge Path Map

### Overview

Replace the collapsible tier sections (lines 239-354 in Learn.tsx) with a visual badge path map. Rewrite `TierRoadmap.tsx` as the path map component since its current implementation (feature roadmap with progress bars) doesn't match the new design — it's simpler to rebuild it with the new layout.

### New `TierRoadmap` Component

**File:** `src/components/education/TierRoadmap.tsx`

Completely reworked. New props:

```typescript
interface BadgePathMapProps {
  modulesByTier: Record<string, Module[]>;
  earnedModuleIds: Set<string>;
  isModuleUnlocked: (module: Module) => boolean;
  moduleProgress: Record<string, { completed: number; total: number }>;
  onModuleClick: (slug: string) => void;
  tierFeatures: TierUnlock[];
}
```

**Rendering per tier:**

1. **Tier label row** — tier name (colored) + X/Y badge count + feature unlock pills (kept from current collapsible headers)

2. **Horizontal scrollable badge row** — `overflow-x-auto` with `scrollbar-hide`, nodes connected by a horizontal SVG/CSS line:

   - **COMPLETED node**: Filled circle with tier gradient color, badge emoji (from `EducationBadge` `badgeIcons` mapping), small green checkmark overlay, `animate-scale-in` on mount
   - **CURRENT node** (first unlocked + not earned): Pulsing border ring in tier color (`animate-pulse`), badge emoji visible, "START →" label below
   - **UNLOCKED node** (unlocked, not started or in-progress): Solid border in tier color, badge emoji, mini progress bar below if `moduleProgress` shows partial completion
   - **LOCKED node**: Gray circle, Lock icon, `opacity-40`

3. **Connector line** between nodes: a horizontal dashed/solid line segment. Completed segments = tier color, incomplete = muted.

**Interactions:**
- Completed/Current/Unlocked: `onClick → onModuleClick(slug)` which calls `navigate(/learn/${slug})`
- Locked: show tooltip "Complete previous badges first" using a simple title attribute or a toast on tap (mobile-friendly)

### Changes to `src/pages/Learn.tsx`

1. **Replace lines 239-353** (the `tierOrder.map` with Collapsible) with a single `<BadgePathMap>` component call

2. **Remove imports** no longer needed: `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger`, `ChevronDown`

3. **Remove state**: `openTiers`, `toggleTier` — no longer needed since tiers are always visible

4. **Pass props** to BadgePathMap: `modulesByTier`, `earnedModuleIds`, `isModuleUnlocked`, `moduleProgress`, `onModuleClick`, `tierFeatures`

5. Keep everything else unchanged: header, ContinueLearning, StreakCalendar, DailyChallenge, overall progress bar, VIP upsell, LeaderboardCard

### Files

| # | File | Change |
|---|------|--------|
| 1 | `src/components/education/TierRoadmap.tsx` | Rewrite as BadgePathMap with horizontal scrollable badge nodes per tier |
| 2 | `src/pages/Learn.tsx` | Replace collapsible tier sections with BadgePathMap, remove unused state/imports |

