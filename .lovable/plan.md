

# Fix Quiz Progression + BDSM Test Location

## Problems Found

### 1. Quiz won't start after completing all sections (CRITICAL)
**Root cause**: Race condition in `SectionContent.tsx`. When the user clicks "Take Module Quiz" on the last section:
- `onComplete()` is called (async — triggers `markComplete` which does `setProgress`)
- `onNext()` fires immediately after, synchronously
- At that moment, `allSectionsComplete` is still `false` because React hasn't re-rendered with the updated progress
- So `canTakeQuiz` is false, and the quiz never opens
- Users are permanently stuck — they can't earn badges, can't access Discovery

**Fix in `src/pages/LearnModule.tsx`**:
- Change the `onNext` callback for the last section: instead of relying on `canTakeQuiz` (which is stale), directly call `setShowQuiz(true)` when `isLast` is true and the section was just completed
- Specifically, update the `onNext` handler (line 337-339) to accept that when it's the last section and we just called onComplete, the quiz should open regardless of the current `allSectionsComplete` state
- Add a separate visible "Take Quiz" button that appears below the section navigation when all sections are complete, as a fallback

### 2. No visible "Take Quiz" button when sections exist
Even if the race condition is fixed, users have no obvious way to start the quiz if they've already completed all sections and navigated back. The quiz is only accessible by clicking "Next" on the last section.

**Fix in `src/pages/LearnModule.tsx`**:
- Add a visible "Take Quiz" card (similar to the no-sections version at lines 361-379) that appears below the section content when `canTakeQuiz` is true and `!showQuiz`

### 3. BDSM Test location
The BDSM test section is on the **Edit Profile** page (`/profile/edit`). Users can find it by going to Profile → Edit Profile → scroll down to the "Kink Profile" card. No code changes needed — just needs to be communicated to the user.

## Files to modify
- `src/pages/LearnModule.tsx` — fix race condition + add visible quiz button

