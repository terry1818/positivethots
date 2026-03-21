

# Supercharge Learn Section — Research-Backed Gamification Overhaul

## Research Foundations

The changes below are grounded in specific behavioral science:

- **Variable Ratio Reinforcement** (Skinner, 1957): Random bonus XP rewards are more addictive than fixed rewards — the brain keeps coming back hoping for the next hit
- **Zeigarnik Effect** (1927): People remember incomplete tasks better — showing "3/5 sections done" creates an itch to finish
- **Endowed Progress Effect** (Nunes & Dreze, 2006): Giving users a head start (e.g., "You're already 20% there!") increases completion rates by 34%
- **Goal Gradient Effect** (Hull, 1932): People accelerate effort as they approach a goal — animated progress bars exploit this
- **Flow State Triggers** (Csikszentmihalyi, 1990): Clear goals + immediate feedback + just-right challenge = addictive engagement
- **Streak Aversion / Loss Aversion** (Kahneman & Tversky, 1979): People work 2x harder to avoid losing a streak than to gain a reward
- **Spacing Effect** (Ebbinghaus, 1885): Distributed practice > massed practice — daily streak mechanic naturally enforces this
- **Self-Determination Theory** (Deci & Ryan, 2000): Autonomy + competence + relatedness = intrinsic motivation

## Changes

### 1. Daily Challenge System (new)
**Science**: Variable ratio reinforcement + flow state

- New `DailyChallenge` component on Learn page showing a rotating daily micro-goal ("Complete 2 sections today", "Get 3 quiz answers right in a row", "Earn 50 XP")
- Completing it awards bonus XP (15-30, randomized — variable ratio)
- New DB table `daily_challenges` with `user_id`, `challenge_type`, `target`, `progress`, `completed`, `date`
- Animated card with countdown timer showing hours left in the day

### 2. Enhanced Streak System with Urgency
**Science**: Loss aversion + streak aversion

- Redesigned `StreakBadge` with flame intensity tiers (small flame 1-2, medium 3-6, large 7-13, blazing 14-29, inferno 30+) with progressive glow/particle effects
- **Streak-at-risk warning banner** on Learn page: "Your 7-day streak expires in 4h 23m!" with pulsing red/orange gradient
- Streak freeze indicator: shows when available, glows to draw attention
- Streak recovery: if lost within 24h, offer a "reclaim" via completing 2 sections (creates sunk-cost motivation)
- Weekly streak calendar view (7 dots showing completed days, like GitHub contribution graph)

### 3. XP Multiplier & Bonus Events
**Science**: Variable ratio reinforcement + dopamine spikes

- **Combo XP multiplier in sections**: Complete sections back-to-back without leaving = 1.5x XP multiplier badge shown in header
- **First section of the day**: "Daily Bonus +5 XP" with special animation
- **Perfect quiz streak bonus**: Getting 3+ correct in a row shows escalating "COMBO x3!" "COMBO x4!" with screen shake
- Enhanced `XPPopup` with particle burst, size scaling with amount, and sound-like visual pulse

### 4. Bite-Sized Progress Indicators (Duolingo-style)
**Science**: Goal gradient effect + Zeigarnik effect

- Replace the winding `LearningPath` with a **horizontal scrollable lesson bar** (like Duolingo's crown system) — compact, visual, mobile-friendly
- Each section node shows: locked/current/complete state with crown icons for perfect scores
- **Mini progress ring** inside each section node showing read-through percentage
- Section cards show estimated time as "~3 min" badges to reduce commitment anxiety (micro-commitment framing)

### 5. Enhanced Quiz Experience
**Science**: Flow state + immediate feedback + variable rewards

- **Timer per question** (optional, shown as gentle countdown ring, not punitive) — creates urgency without stress
- **Answer streak fire trail**: Correct answers leave a visual "fire" trail across the progress dots
- **"Almost there!" encouragement** when 1 question from passing threshold
- **Random bonus questions** worth double XP (marked with a sparkle icon) — variable ratio
- **Quiz results breakdown**: Show which sections each wrong answer relates to, with "Review this section" quick links
- Screen shake on wrong answer, confetti burst on correct

### 6. Section Content Engagement Upgrades
**Science**: Active recall + elaborative interrogation

- **Reading progress bar** at top of section content (scroll-based) — Zeigarnik effect
- **"Key Takeaway" cards** at end of each section: highlighted summary box the user can tap to "save" — active processing
- **Reflection prompts** between sections: "Before moving on, what's one thing you'll apply from this?" (text input, stored but not graded) — elaborative interrogation
- **Section completion animation**: Checkmark bursts into particles, node glows, "Section complete!" banner slides in

### 7. Learn Page Hub Upgrades
**Science**: Endowed progress + social proof

- **"Continue Learning" hero card** at top: Shows the exact module/section they were last in with a big CTA and progress ring — reduces friction to 1 tap
- **Daily streak calendar** (7-day row) right below header
- **"Today's Goal" progress ring**: "2/3 sections today" circular progress — creates a session goal
- **Community stats bar**: "1,247 learners active today" (computed or seeded) — social proof
- **Tier unlock celebrations**: When all modules in a tier are completed, show a tier-specific celebration with a special tier badge

### 8. Sound & Haptic Feedback Cues (CSS-based visual proxies)
**Science**: Multi-sensory reinforcement

Since we can't do actual audio/haptics in a web app easily, simulate with:
- **Screen flash** (brief white/gold overlay) on XP awards
- **Vibration-style shake** animation on wrong quiz answers
- **Pulse ripple** emanating from completed section nodes
- **Heartbeat pulse** on streak-at-risk warnings

## New Components

| Component | Purpose |
|-----------|---------|
| `src/components/education/DailyChallenge.tsx` | Daily rotating micro-goal card with countdown |
| `src/components/education/StreakCalendar.tsx` | 7-day dot calendar showing learning activity |
| `src/components/education/ContinueLearning.tsx` | Hero card with last module/section + progress |
| `src/components/education/SessionGoal.tsx` | "Today's goal" circular progress tracker |
| `src/components/education/ReadingProgress.tsx` | Scroll-based reading progress bar |
| `src/components/education/KeyTakeaway.tsx` | Highlighted summary card at section end |
| `src/components/education/QuizCombo.tsx` | Enhanced combo counter with fire trail |

## New CSS Animations

- `screen-flash` — brief gold overlay on XP
- `shake-wrong` — horizontal shake on wrong answer
- `ripple-complete` — expanding ring from completed node
- `heartbeat` — pulsing scale for urgent warnings
- `fire-trail` — gradient sweep across quiz dots on combo
- `crown-spin` — rotation for perfect score crowns

## Database Changes

New table: `daily_challenges`
```sql
CREATE TABLE daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_type text NOT NULL,
  target_value integer NOT NULL DEFAULT 1,
  current_progress integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  xp_reward integer NOT NULL DEFAULT 15,
  challenge_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_date)
);
```

New column on `user_learning_stats`: `streak_recovered_at` (timestamptz, nullable) for 24h reclaim window.

## Files Changed

| File | Action |
|------|--------|
| `src/index.css` | Add 6 new keyframes |
| `tailwind.config.ts` | Register new animation utilities |
| `src/pages/Learn.tsx` | Add ContinueLearning hero, DailyChallenge, StreakCalendar, SessionGoal, community stats |
| `src/pages/LearnModule.tsx` | Reading progress bar, enhanced quiz combo, section completion animations, reflection prompts |
| `src/components/education/LearningPath.tsx` | Redesign to horizontal scrollable Duolingo-style bar |
| `src/components/education/SectionContent.tsx` | Add KeyTakeaway cards, reading progress, completion animations |
| `src/components/education/StreakBadge.tsx` | Flame intensity tiers with particle effects, at-risk state |
| `src/components/education/XPPopup.tsx` | Particle burst, size scaling, screen flash |
| `src/components/education/CelebrationModal.tsx` | Enhanced confetti, tier celebrations |
| `src/hooks/useLearningStats.ts` | XP multiplier logic, streak recovery, daily bonus tracking |
| `src/hooks/useModuleProgress.ts` | Reading progress percentage, session goal tracking |
| `src/components/education/DailyChallenge.tsx` | Create |
| `src/components/education/StreakCalendar.tsx` | Create |
| `src/components/education/ContinueLearning.tsx` | Create |
| `src/components/education/SessionGoal.tsx` | Create |
| `src/components/education/ReadingProgress.tsx` | Create |
| `src/components/education/KeyTakeaway.tsx` | Create |
| `src/components/education/QuizCombo.tsx` | Create |
| Database migration | `daily_challenges` table + RLS + `streak_recovered_at` column |

