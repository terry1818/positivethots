

## Plan: Evidence-Based Learning — Explanations + Checkpoint Questions

### Part A — Database Migration

One new migration that:

1. Adds 4 columns to `quiz_questions`:
   - `explanation_correct TEXT` — feedback for correct answers
   - `explanation_wrong TEXT` — feedback for wrong answers (SHA non-shaming framing)
   - `is_checkpoint BOOLEAN DEFAULT false` — inline mid-section recall questions
   - `position_in_section INTEGER DEFAULT NULL` — paragraph index for checkpoint placement

2. Recreates the `quiz_questions_public` view to include the new columns (excluding `correct_answer`):
   ```sql
   DROP VIEW IF EXISTS public.quiz_questions_public;
   CREATE VIEW public.quiz_questions_public
   WITH (security_invoker = true) AS
     SELECT id, module_id, question, options, order_index, section_id,
            explanation_correct, explanation_wrong, is_checkpoint, position_in_section
     FROM public.quiz_questions;
   ```

No RLS or RPC changes needed.

---

### Part B — Quiz UI Changes in `src/pages/LearnModule.tsx`

**Question interface**: Add `explanation_correct`, `explanation_wrong`, `is_checkpoint`, `position_in_section` fields.

**Question filtering**: After loading questions, split into two arrays:
- `badgeQuestions` — where `is_checkpoint` is false/null (used for quiz)
- `checkpointQuestions` — where `is_checkpoint` is true (passed to SectionContent)

All existing quiz logic (submit, score, combo, violations) operates on `badgeQuestions` only.

**Quiz answer flow** (replaces the current 400ms auto-advance):
1. On answer selection: mark selected option green (correct) or red (wrong)
2. If wrong: also highlight the correct option in green
3. Show a feedback card below options:
   - Correct: green callout with `explanation_correct` text
   - Wrong: red callout with `explanation_wrong` text + correct answer restated
4. Show a "Next Question →" button (replaces auto-advance `setTimeout`)
5. On last question, the button reads "Review & Submit"
6. QuizCombo, submit button, score calculation — all unchanged

**Pass `checkpointQuestions` to SectionContent**: Filter by matching `section_id` to current section, pass as new prop.

---

### Part C — Checkpoint Questions in `src/components/education/SectionContent.tsx`

**New optional prop**: `checkpointQuestions` array with question data.

**Rendering logic**: Modify `renderMarkdown` to return an array of React elements. After each paragraph at index N, if a checkpoint question has `position_in_section === N`, insert a QuickCheck card.

**QuickCheck card UI**:
- Purple/violet border with "Quick Check 🧠" label in small caps
- Question text + 2-4 answer options as compact chip buttons
- Local state per checkpoint (answered/selected)
- On selection: immediate correct/wrong coloring + explanation text
- "Got it! Keep reading →" dismiss button after answering
- No XP, no grading, no server calls
- Fully backward compatible (renders nothing if prop is absent/empty)

---

### Files

| # | File | Change |
|---|------|--------|
| 1 | 1 migration | Add columns + recreate view |
| 2 | `src/pages/LearnModule.tsx` | Question filtering, quiz feedback UI, pass checkpoint prop |
| 3 | `src/components/education/SectionContent.tsx` | Accept checkpoint prop, render QuickCheck cards inline |

