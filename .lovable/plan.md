

# Celebration Animation with Mascot Character

## Approach

The logo contains a woman character (mascot). I'll use AI image generation to create a standalone version of this character in a celebratory pose (transparent background, arms raised, confetti around her), then save it as a static asset and use it in the tier completion celebration animation.

## Steps

### 1. Generate mascot celebration image
Use the AI image generation API (via an edge function or build-time script) to create a stylized illustration of a celebratory woman character inspired by the logo — arms up, joyful expression, party/confetti vibe. Save as `src/assets/mascot-celebration.png`.

Since we can't programmatically extract the woman from the logo at build time in a client-side app, I'll generate a new illustration that matches the logo's art style and use it as a dedicated celebration asset.

### 2. Update CelebrationModal (`src/components/education/CelebrationModal.tsx`)

For `tier_complete` type:
- Replace the Trophy icon with the mascot celebration image
- Wrap in an animated container with:
  - **Entrance**: CSS `mascot-entrance` animation (scale 0 → 1.15 → 1 with slight rotation)
  - **Idle**: gentle floating animation after entrance
  - **Glow ring**: pulsing purple glow ring behind the mascot
- Increase confetti to 80 particles with brand colors (purple, magenta, gold, violet)
- Add a Web Audio API celebration sound (3 ascending tones, ~300ms total)

### 3. Add CSS animations (`src/index.css`)
- `@keyframes mascot-entrance` — scale bounce-in with rotation
- `@keyframes float-gentle` — subtle vertical float loop
- `@keyframes confetti-fall` (if not already present) — top-to-bottom fall with rotation

### Files to modify
- `src/assets/mascot-celebration.png` — new generated asset
- `src/components/education/CelebrationModal.tsx` — mascot image, enhanced confetti, celebration sound
- `src/index.css` — new keyframe animations
- `tailwind.config.ts` — register new animation utilities

