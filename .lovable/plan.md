## Plan: Emotional Design Systems Upgrade

### Overview
Seven interconnected systems spanning celebrations, mascot reactions, streak urgency, match upgrades, swipe feedback, daily rewards, and notification templates.

### Phase 1: Core Infrastructure

#### 1a. Confetti System (`src/components/celebrations/ConfettiSystem.tsx`)
- CSS-only confetti with 4 intensity levels (light/medium/heavy/epic)
- Brand-weighted colors (40% purple, 30% pink, 15% gold, 10% green, 5% white)
- Reduced-motion fallback: static "✨ Achievement!" text
- Particle shapes: square, circle, rectangle via border-radius

#### 1b. Celebration Engine (`src/components/celebrations/CelebrationEngine.tsx`)
- 5-tier orchestrator: micro → small → medium → large → epic
- Each tier controls: confetti intensity, sound, haptic pattern, duration, modal vs inline
- Integrates with existing sound system (`soundGenerator.ts`) and haptics (`haptics.ts`)
- Reduced-motion: skip animations, show static achievement text

### Phase 2: Mascot System

#### 2a. Mascot Reaction Component (`src/components/mascot/MascotReaction.tsx`)
- 12 emotional states with CSS animations (encouraging, cheering, empathetic, celebrating, proud, worried, excited, thinking, waving, sleeping, surprised, love)
- Speech bubble with Pacifico/Inter fonts
- 4 positions: inline, bottom-right, center, toast
- 3 sizes: small (48px), medium (96px), large (144px)
- Reduced-motion: static pose only

### Phase 3: Streak Urgency

#### 3. Streak Urgency Animation (modify `StreakBadge.tsx`)
- Time-based animation intensity: static → gentle pulse → faster pulse → rapid pulse → frantic shake
- Green checkmark overlay when streak maintained
- Blue/ice overlay when streak freeze active
- Requires checking current hour + whether daily activity is done

### Phase 4: Match Celebration Upgrade

#### 4. Match Modal Upgrade (modify `MatchModal.tsx`)
- Replace current flat celebration with sequenced animation:
  - Screen dim → photos slide in → particle burst → text fade → CTAs
- Mascot with 'love' emotion + floating hearts
- Compatibility score count-up animation
- First-ever match gets EPIC tier treatment
- Shared interests shown as pills

### Phase 5: Swipe Feedback

#### 5. Color-Coded Swipe Feedback (modify `SwipeDiscoveryCard.tsx`)
- Right drag: purple tint overlay + "CONNECT" text + purple glow
- Left drag: grayscale desaturation + "PASS" text
- Up drag: pink/magenta gradient + "SEND A THOT" + sparkles (premium feel)
- Physics: rotation proportional to drag, spring-back on cancel, velocity-based throw

### Phase 6: Daily Rewards

#### 6a. Database Migration
- Add `last_daily_reward_date` column to profiles table

#### 6b. Daily Reward Modal (`src/components/rewards/DailyRewardModal.tsx`)
- Variable ratio rewards: 60% +5XP, 20% +10XP, 10% +15XP, 5% +25XP, 5% 2x boost
- Weekly bonus on day 7
- Mascot waving with welcome message
- Pulsing "Daily Bonus" indicator until claimed

### Phase 7: Notification Templates

#### 7. Notification Templates (`src/lib/notification-templates.ts`)
- Templates for: streak risk, streak critical, streak lost, new match, new message, badge almost complete, inactive 3/7 days, weekly summary, daily challenge
- Branded language only (no "Super Like", "Swipe Right", etc.)
- Random copy rotation for variable reinforcement
- Max 3/day rule, quiet hours 10pm-8am (except streak-critical)

### Files Created
| File | Purpose |
|------|---------|
| `src/components/celebrations/ConfettiSystem.tsx` | Reusable CSS confetti |
| `src/components/celebrations/CelebrationEngine.tsx` | 5-tier celebration orchestrator |
| `src/components/mascot/MascotReaction.tsx` | 12-emotion mascot component |
| `src/components/rewards/DailyRewardModal.tsx` | Daily first-open reward |
| `src/lib/notification-templates.ts` | Push notification copy templates |

### Files Modified
| File | Change |
|------|--------|
| `src/components/education/StreakBadge.tsx` | Time-based urgency animations |
| `src/components/MatchModal.tsx` | Sequenced match celebration |
| `src/components/discovery/SwipeDiscoveryCard.tsx` | Color-coded drag feedback |
| `src/index.css` | New keyframe animations for celebrations + mascot |
| `tailwind.config.ts` | New animation utilities |

### Database Migration
- `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_daily_reward_date DATE`

### Standards
- All animations CSS-only (no heavy libs)
- prefers-reduced-motion respected everywhere
- 44x44px touch targets
- Mobile-first 375px
- Branded language throughout
