

# Fix: LearnModule crash for admin users

## Root Cause
The `QuizEditor` component calls `question.correct_answer.toString()` (line 183), but the questions are fetched from the `quiz_questions_public` view which intentionally excludes the `correct_answer` column (for security). Since the user has an admin role, the `AdminPanel` renders, `QuizEditor` initializes with these incomplete question objects, and the `.toString()` call on `undefined` crashes the entire page via the ErrorBoundary.

## Fix

**File: `src/components/admin/QuizEditor.tsx`**
- Line 183: Change `question.correct_answer.toString()` to `(question.correct_answer ?? 0).toString()` to handle the undefined case safely.

**File: `src/pages/LearnModule.tsx`**
- When the user is an admin, fetch questions from `quiz_questions` (which includes `correct_answer`) instead of `quiz_questions_public`. This ensures the QuizEditor gets complete question data.
- Add a conditional query: check admin role first, then query the appropriate table.

This is a two-line fix that resolves the crash for all learning courses.

