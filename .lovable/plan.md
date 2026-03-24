

## Problem

Module progress shows 100% when all sections are read, even if the quiz hasn't been passed yet. The quiz is a required part of completing a module (earning a badge), so progress should reflect that.

## Affected Areas

1. **Learn page (`src/pages/Learn.tsx`)** — Per-module progress bar and section count text. Currently `sectionPercent = completed_sections / total_sections`. When all sections are done but quiz not passed, this shows 100%.

2. **`useModuleProgress` hook (`src/hooks/useModuleProgress.ts`)** — `completionPercent`, `isAllComplete`, and `completedCount` only consider sections, not quiz status.

3. **`ContinueLearning` component** — Skips modules where all sections are completed, but doesn't check quiz/badge status.

4. **`LearningPath` component** — The quiz node already shows differently based on `allComplete`, but the overall visual impression is "done" when all section nodes are green.

## Plan

### 1. Cap section-only progress at 90% on Learn page
In `src/pages/Learn.tsx`, change the `sectionPercent` calculation so that when all sections are complete but the badge is not earned, progress caps at 90% instead of 100%. This visually communicates "almost done — take the quiz."

- Change line ~274: if `progress.completed === progress.total && !isCompleted`, cap at 90%
- Update the section count text (line ~302) to show "Quiz remaining" when all sections done but no badge

### 2. Update `useModuleProgress` hook
In `src/hooks/useModuleProgress.ts`, add awareness that quiz completion matters:
- Cap `completionPercent` at 90% when all sections are done (since the hook doesn't know badge status, it should expose a flag like `sectionsAllDone` and let consumers decide, or simply cap the percent)
- Since the hook is used in `LearnModule.tsx` which already tracks `isAlreadyCompleted` separately, the cleanest approach is to just cap `completionPercent` at 90 when `completedCount === sections.length`

### 3. Update ContinueLearning component
In `src/components/education/ContinueLearning.tsx`, when checking if a module is "fully complete" before skipping to the next, also check if the user has earned the badge for that module (not just sections completed).

## Summary of Changes

| File | Change |
|------|--------|
| `src/pages/Learn.tsx` | Cap progress at 90% when sections done but no badge; show "Quiz remaining" text |
| `src/hooks/useModuleProgress.ts` | Cap `completionPercent` at 90% when all sections complete |
| `src/components/education/ContinueLearning.tsx` | Check badge earned before considering module complete |

