

# Fix Learn Page: Progress Bars, Default Tier, Continue Learning, Remove Session Goal

## 4 Changes

### 1. Add per-module progress bars in tier dropdowns
Each module card in the collapsible will show a thin progress bar (completed sections / total sections). This requires fetching section counts and user section progress per module when loading the page.

**File: `src/pages/Learn.tsx`**
- Add new state for module progress: `moduleProgress: Record<string, { completed: number; total: number }>`
- In `loadData`, fetch all `module_sections` (just `id, module_id`) and all `user_section_progress` (completed ones) for the user
- Group sections by `module_id` to get totals, count completed per module
- In each module card, render a thin progress bar below the description showing `completedSections/totalSections` progress

### 2. Default open tier = first incomplete tier (not always Foundation)
**File: `src/pages/Learn.tsx`**
- Change `openTiers` initialization from `{ foundation: true }` to be computed after data loads
- After `setModules` and `setUserBadges`, determine which tier is the first one with incomplete modules
- Set that tier as the default open tier via `setOpenTiers({ [firstIncompleteTier]: true })`
- If all tiers complete, don't auto-open any

### 3. Fix "Continue Learning" showing 100% complete modules
**File: `src/components/education/ContinueLearning.tsx`**
- The bug: it picks the most recently accessed section regardless of whether the module is fully complete
- Fix: after loading the continue data, check if `completedSections === totalSections`. If so, find the next incomplete module instead, or hide the card entirely if everything is done
- Simplest fix: if `progressPercent === 100`, try to find the next incomplete module. If none exists, return `null`

### 4. Remove SessionGoal component
**File: `src/pages/Learn.tsx`**
- Remove `<SessionGoal>` usage (line 155) and its import (line 14)
- Keep `StreakCalendar` in the stats block

## Files to modify
- `src/pages/Learn.tsx` — progress bars, default tier logic, remove SessionGoal
- `src/components/education/ContinueLearning.tsx` — fix 100% complete bug

