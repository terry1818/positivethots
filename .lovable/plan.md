
# Gamify the Education Hub - Duolingo-Style Engagement

## Overview
Transform the education section from a straightforward course list into an engaging, rewarding learning experience inspired by Duolingo's proven engagement mechanics. The changes focus on motivation loops, visual feedback, and a sense of progression.

## Features to Add

### 1. XP Points and Leveling System
- Earn XP for completing sections (10 XP each), passing quizzes (50 XP), and achieving perfect quiz scores (25 XP bonus)
- A visible XP bar in the Learn header showing progress toward the next level
- Levels (e.g., "Curious", "Explorer", "Scholar", "Expert", "Sage") that grow as XP accumulates
- Levels displayed on the user's profile alongside badges

### 2. Daily Learning Streaks
- Track consecutive days the user completes at least one section or quiz
- Display a flame/fire icon with streak count in the Learn header
- Streak freeze: users can "bank" one freeze per 7-day streak to protect against missing a day
- Milestone celebrations at 3, 7, 14, 30, and 100 days with animated confetti

### 3. Animated Celebrations and Feedback
- Confetti burst animation when earning a badge or passing a quiz
- XP "+10 XP" floating animation when completing a section
- Streak milestone pop-up modals with fun messaging
- Progress bar fills with a satisfying animated transition
- Section completion gets a quick checkmark animation instead of just toggling state

### 4. Enhanced Section Navigation (Duolingo-style path)
- Replace the flat numbered pill buttons with a vertical winding path layout on the module page
- Each section is a circle/node on the path, connected by a line
- Completed nodes glow with the tier color, current node pulses, future nodes are grayed out
- The path gives a visual "journey" feel instead of a flat progress bar

### 5. Quiz Enhancements
- Show a progress indicator during the quiz ("Question 3 of 20")
- Immediate per-question feedback option: after answering, briefly flash green/red before moving on
- A "combo" counter for consecutive correct answers with encouraging messages ("3 in a row!", "On fire!")
- Results screen shows a breakdown: correct answers by section topic, weakest area, and XP earned

### 6. Leaderboard (Optional/Social)
- Weekly XP leaderboard showing top learners (anonymized or opt-in names)
- Encourages friendly competition without being toxic
- Resets weekly to keep it fresh

---

## Technical Plan

### Database Changes
Create a new `user_learning_stats` table:
```text
user_learning_stats
  - user_id (uuid, PK, references profiles)
  - total_xp (integer, default 0)
  - current_level (integer, default 1)
  - current_streak (integer, default 0)
  - longest_streak (integer, default 0)
  - last_activity_date (date)
  - streak_freeze_available (boolean, default false)
  - updated_at (timestamp)
```

Create a new `xp_transactions` table for the XP activity feed:
```text
xp_transactions
  - id (uuid, PK)
  - user_id (uuid)
  - xp_amount (integer)
  - source (text: 'section_complete', 'quiz_pass', 'quiz_perfect', 'streak_bonus')
  - source_id (text, nullable - module/section id)
  - created_at (timestamp)
```

RLS policies on both tables: users can only read/insert their own rows.

### New Components
- `StreakBadge` - fire icon with streak count, shown in Learn header
- `XPBar` - progress bar showing current XP toward next level
- `XPPopup` - floating "+10 XP" animation on section/quiz completion
- `CelebrationModal` - confetti modal for badge/streak milestones
- `LearningPath` - vertical winding path replacing flat section nav inside modules
- `QuizProgress` - "Question X of 20" bar with combo counter
- `QuizResults` - enhanced results screen with XP breakdown and topic analysis

### Modified Components
- `Learn.tsx` - Add streak display, XP bar, and level indicator to header
- `LearnModule.tsx` - Integrate XP awards on section/quiz completion, trigger celebrations
- `SectionContent.tsx` - Trigger XP popup animation on completion
- `SectionNav.tsx` - Replace with LearningPath component inside modules
- `Profile.tsx` - Show level and streak alongside existing badges

### XP and Level Logic
- Levels scale with increasing XP thresholds: Level 1 (0), Level 2 (100), Level 3 (300), Level 4 (600), Level 5 (1000), etc.
- Streak calculation: compare `last_activity_date` with today's date on each visit. If yesterday, increment. If today, no change. If older, reset to 1.
- All XP mutations happen client-side with optimistic UI, then persist to database.

### Animations
- Use existing Tailwind animation utilities (fade-in, scale-in) for most transitions
- Add a CSS confetti keyframe animation for celebrations
- XP float uses a custom `float-up` keyframe (translate Y + fade out)

## Priority Order
1. XP system + database tables (foundation for everything else)
2. Streak tracking + streak badge UI
3. Celebration animations (confetti, XP popups)
4. Enhanced quiz experience (progress bar, combo counter, results)
5. Learning path visual (vertical winding path)
6. Leaderboard (optional, can add later)
