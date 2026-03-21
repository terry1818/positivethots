

# Apply Engagement Principles Across the Entire App

## What We're Doing

Taking the same research-backed principles that made onboarding engaging (micro-rewards, animated transitions, visual variety, emotional design, live feedback) and applying them to every page in the app: Discovery, Messages, Chat, Profile, Learn, Likes, Premium, Settings, and the BottomNav.

## Changes by Page

### 1. BottomNav — Animated & Alive
- Active tab gets a scale-bounce + gradient underline indicator (not just color change)
- Tap triggers a subtle haptic-feel scale animation on the icon
- Unread count badges pulse with a glow animation on Messages and Likes tabs
- Smooth icon transitions when switching tabs

### 2. Discovery (Index) — Card Entrance Animations + Match Celebration
- Profile cards enter with staggered fade-in animations as they load (waterfall reveal)
- Stats bar numbers animate up (count-up effect) when the page loads
- Connect button pulses with a subtle glow to draw attention
- Pass/Connect actions trigger micro emoji bursts (reuse `MicroCelebration`)
- Empty state gets an animated illustration (floating hearts)
- Loading state: pulsing gradient skeleton cards instead of a plain spinner

### 3. Match Modal — Confetti Explosion
- Add confetti particle animation (hearts + sparkles falling from top)
- Profile photo entrance: scale-up bounce with glow ring
- "It's a Match!" text uses a typewriter-style reveal
- Pulsing gradient background instead of static gradient

### 4. Messages — Lively List
- Match cards slide in with staggered delays on load
- Online indicator pulses green
- Empty state: animated floating message bubbles instead of static icon
- New message indicator glows/pulses

### 5. Chat — Immersive Messaging
- Sent messages animate in with a slide-up + fade
- Received messages slide in from left
- Typing indicator dots get a smoother wave animation
- Send button pulses when there's text in the input
- Message delivered/read checkmarks animate in

### 6. Profile — Dynamic & Visual
- Profile card image has a subtle parallax-like gradient overlay that shifts
- Badges section: earned badges have a shimmer/glow effect
- Stats (XP, level, streak) animate with count-up on load
- Interest tags enter with stagger animation
- Edit and Sign Out buttons have hover lift effects

### 7. Learn — Gamified Progress
- Progress bar fills with an animated gradient sweep
- Module cards pulse briefly when they become unlocked
- Tier headers have a subtle shimmer on the gradient background
- Completed modules get a satisfying checkmark bounce animation
- "Discovery unlocked!" message gets a celebration animation

### 8. Likes You — Reveal Animation
- Blurred cards have a teasing "peek" animation (slight unblur pulse)
- Premium CTA card has a shimmering gold border animation
- When premium users connect, trigger confetti micro-celebration
- Cards enter with stagger animation

### 9. Premium — Sell the Dream
- Benefits list items enter with stagger animation
- Price card has a pulsing gradient border
- Crown icon rotates/glows
- Subscribe button has a shimmer sweep effect (like a shiny CTA)
- Background: subtle floating orbs like auth page

### 10. Settings — Polish
- Theme option cards animate selection with a smooth border color transition
- Active theme gets a subtle glow effect

### 11. Auth — Already Good, Minor Tweaks
- Form fields focus state: border glows purple
- Submit button gets the shimmer sweep effect
- Toggle between sign-up/sign-in animates the form height change

### 12. Edit Profile — Smoother
- Sections enter with stagger animation on load
- Save button pulses when there are unsaved changes
- Photo upload area has a dashed border pulse animation

## New Shared Components/Utilities

| Component | Purpose |
|-----------|---------|
| `src/components/AnimatedCounter.tsx` | Count-up number animation for stats |
| `src/components/ShimmerButton.tsx` | CTA button with sweeping shine effect |
| `src/components/StaggerChildren.tsx` | Wrapper that staggers child entrance animations |
| `src/components/PulseGlow.tsx` | Wrapper that adds pulse-glow to any element |
| `src/components/AnimatedSkeleton.tsx` | Gradient-sweep skeleton loader |

## New CSS Animations (index.css + tailwind.config.ts)

- `shimmer-sweep` — light sweep across buttons/cards
- `count-up` — for AnimatedCounter (JS-driven, not CSS)
- `slide-in-left` / `slide-in-right` — for chat messages
- `pulse-border` — pulsing border for Premium CTA
- `peek-unblur` — teasing blur reduction for locked Likes cards
- `wiggle` — subtle attention-grabbing wiggle for CTAs
- `glow-ring` — glowing ring effect for match modal photo

## Technical Approach

- All animations are CSS keyframes + Tailwind utilities — no animation libraries
- `StaggerChildren` uses CSS `animation-delay` calculated from child index
- `AnimatedCounter` uses `requestAnimationFrame` for smooth counting
- `ShimmerButton` uses a CSS `::after` pseudo-element with a moving gradient
- All animations respect `prefers-reduced-motion`
- Reuse existing `MicroCelebration` component for connect/match moments across pages

## Files Changed

| File | Action |
|------|--------|
| `src/index.css` | Add new keyframes (shimmer, slide-in, pulse-border, peek, wiggle, glow-ring) |
| `tailwind.config.ts` | Register new animation utilities |
| `src/components/AnimatedCounter.tsx` | Create |
| `src/components/ShimmerButton.tsx` | Create |
| `src/components/StaggerChildren.tsx` | Create |
| `src/components/BottomNav.tsx` | Animated active indicator, tap animations, badge pulses |
| `src/pages/Index.tsx` | Staggered cards, animated stats, micro-celebrations, skeleton loaders |
| `src/components/MatchModal.tsx` | Confetti, bounce photo, pulsing bg |
| `src/pages/Messages.tsx` | Staggered list, animated empty state |
| `src/pages/Chat.tsx` | Message entrance animations, send button pulse |
| `src/pages/Profile.tsx` | Badge shimmer, stat animations, stagger tags |
| `src/pages/Learn.tsx` | Animated progress, module pulse, tier shimmer |
| `src/pages/LikesYou.tsx` | Peek animation, stagger cards, connect celebration |
| `src/pages/Premium.tsx` | Shimmer CTA, floating orbs, stagger benefits, pulsing price |
| `src/pages/Settings.tsx` | Selection glow transitions |
| `src/pages/Auth.tsx` | Form focus glow, shimmer submit, animated toggle |
| `src/pages/EditProfile.tsx` | Section stagger, save pulse, photo area animation |

