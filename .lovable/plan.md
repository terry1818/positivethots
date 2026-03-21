

# Make Onboarding Visually Engaging — Research-Backed Redesign

## What Research Says (Applied to Our Changes)

| Principle | Current State | What We'll Add |
|-----------|--------------|----------------|
| Micro-rewards / dopamine | Nothing happens on selection | Confetti burst on step completion, emoji reactions, encouraging toast messages |
| Emotional design | Identical white cards every step | Phase-specific gradient backgrounds, custom illustrations/emojis per step, varied layouts |
| Visual variety | Same card → chips → button on every screen | Mix of full-bleed screens, illustration headers, card stacks, and interactive elements |
| Live feedback / investment | Profile preview only at end | Floating mini-preview that builds progressively from step 6+ onward |
| Progress momentum | Flat segmented bar | Animated progress ring with phase icon + "You're doing great!" encouragements at phase transitions |
| Motion & delight | Basic slide transition | Staggered element entrance animations, selection pulse effects, parallax background orbs |

## Implementation Plan

### 1. Phase-specific gradient backgrounds
Each phase gets a distinct gradient background that shifts as you progress (purple → magenta → warm violet → pink → gold), creating visual variety without changing the layout system. The background transitions smoothly between phases.

### 2. Step completion micro-celebrations
- When advancing steps: animated emoji burst (heart, sparkle, fire) floats up briefly
- At phase transitions (e.g., finishing Identity → Sexuality): a larger celebration with encouraging copy ("You're amazing! Let's talk about what excites you...")
- Chip selections get a satisfying scale-bounce + haptic-feel animation

### 3. Staggered entrance animations
Instead of the whole card sliding in at once, elements enter one by one with staggered delays (heading → subtitle → chips → button), creating a cascading "waterfall" reveal that feels polished and app-like.

### 4. Animated progress indicator
Replace the flat segmented bar with a circular progress ring (showing % complete) plus phase label. Add a pulsing glow effect at milestones (25%, 50%, 75%).

### 5. Illustration/emoji headers per step
Each step gets a large contextual emoji or icon animation above the heading:
- Welcome: waving hand animation
- Gender: rainbow sparkle
- Pronouns: speech bubble
- Sexuality: fire/heart
- Desires: constellation of stars
- Relationship: chain links
- Status: heart badge
- About You: ruler/zodiac
- Lifestyle: leaf/wellness
- Interests: paint palette
- Bio: pen/paper
- Photos: camera flash

### 6. Live mini-profile preview (from step 8 onward)
A small floating card at the bottom of the screen shows a mini version of the user's profile building in real-time — their photo, name, and each new field appearing as they fill it in. Creates the "investment" feeling from the Hook Model.

### 7. Selection delight animations
- Chip selection: quick scale bounce (1.05 → 1.0) + ripple effect
- Deselection: gentle shake
- Max reached: remaining chips gently pulse to indicate limit

### 8. Phase transition interstitials
Between phases, show a brief (1.5s) full-screen interstitial with a large emoji, encouraging message, and the next phase name. Example: "Identity — done! Now let's explore your desires..."

## Files to Change

| File | Changes |
|------|---------|
| `src/pages/Onboarding.tsx` | Add phase gradients, interstitials, micro-celebrations, staggered animations, mini-preview, emoji headers, animated progress ring |
| `src/components/onboarding/StepTransition.tsx` | Add staggered children entrance animation support |
| `src/components/onboarding/ChipSelector.tsx` | Add bounce/ripple selection animations |
| `src/components/onboarding/MicroCelebration.tsx` | New — emoji burst animation component |
| `src/components/onboarding/PhaseInterstitial.tsx` | New — full-screen phase transition overlay |
| `src/components/onboarding/ProgressRing.tsx` | New — circular animated progress indicator |
| `src/components/onboarding/MiniProfilePreview.tsx` | New — floating live profile preview card |
| `src/components/onboarding/StepHeader.tsx` | New — emoji header + animated title per step |
| `src/index.css` | Add keyframes for bounce, ripple, stagger, float, pulse-glow animations |
| `tailwind.config.ts` | Register new animation utilities |

## Technical Notes
- All animations are CSS-only (keyframes + Tailwind classes) — no heavy animation libraries needed
- Phase gradients use CSS custom properties toggled by step number
- Mini-preview uses the same data from formData state, no extra DB calls
- Interstitials auto-dismiss after 1.5s with a skip tap option
- Mobile-first: all animations respect `prefers-reduced-motion` media query

