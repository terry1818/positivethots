

# Rebrand: Purple/Magenta Theme Aligned with Positive Thots Branding

## Overview
Shift the entire app from the current warm coral/teal palette to a deep purple and magenta scheme that matches your branding assets. The new palette draws from color psychology: purple conveys sensuality, mystery, and creativity, while magenta/pink accents add warmth and energy -- perfect for an adult-oriented, sex-positive platform.

## New Color Palette

| Role | Current | New (HSL) | Visual |
|------|---------|-----------|--------|
| Primary | Warm coral (15 85% 60%) | Rich purple (270 60% 50%) | Deep violet |
| Secondary | Teal (175 60% 40%) | Hot magenta (320 70% 55%) | Vibrant pink-magenta |
| Accent | Peach (25 90% 65%) | Electric violet (280 80% 65%) | Bright purple glow |
| Background (light) | Warm cream (30 30% 98%) | Cool near-white (270 15% 98%) | Subtle lavender tint |
| Background (dark) | Dark blue (220 20% 8%) | Deep purple-black (270 25% 8%) | Nightclub dark |
| Muted | Warm gray (30 15% 94%) | Lavender gray (270 10% 94%) | Soft purple-gray |
| Success | Green (160 70% 40%) | Keep green (160 70% 40%) | Stays for clarity |
| Destructive | Red (0 70% 55%) | Keep red (0 70% 55%) | Stays for clarity |

## Color Psychology Rationale
- **Purple**: Associated with luxury, sensuality, and creativity. Creates an exclusive, premium feel that keeps users engaged.
- **Magenta/Pink**: Energetic, passionate, and playful. Drives action and emotional connection.
- **Dark mode emphasis**: The bokeh-style branding looks best against dark backgrounds, making dark mode the star of the show.
- **Contrast with competitors**: Most dating apps use red/pink (Tinder) or yellow (Bumble). Purple is distinctive and ownable.

## Logo Update
- Replace the current dual-heart Lucide icon logo with the actual "Positive Thots" pinup logo image from the uploaded assets
- Use the transparent version (`positivethotspinup-Recovered.png`) as the in-app logo
- Copy the logo to `src/assets/` and import it in the Logo component

## Files to Change

### Core Theme
- **`src/index.css`** -- Update all CSS custom properties (both light and dark mode) to the new purple/magenta palette. Update gradient variables and shadow colors.
- **`tailwind.config.ts`** -- No structural changes needed (it reads from CSS variables), but update any hardcoded color references if present.

### Logo
- **`src/components/Logo.tsx`** -- Replace Lucide hearts with the actual brand logo image. Keep size variants (sm/md/lg).
- Copy `positivethotspinup-Recovered.png` to `src/assets/logo.png`

### Pages (gradient and color class updates)
- **`src/pages/Auth.tsx`** -- Update gradient background from coral/teal tints to purple/magenta tints
- **`src/pages/Index.tsx`** -- Update `bg-gradient-warm`, stat card accent colors
- **`src/pages/Learn.tsx`** -- Update tier config colors to work within purple palette, update gradient on progress card
- **`src/pages/Onboarding.tsx`** -- Update gradient background
- **`src/pages/Profile.tsx`** -- Update profile header gradient
- **`src/pages/Messages.tsx`** and **`src/pages/Chat.tsx`** -- Update any hardcoded color references

### Components
- **`src/components/MatchModal.tsx`** -- Update gradient from `from-primary to-secondary` (works automatically via CSS vars)
- **`src/components/education/LearningPath.tsx`** -- Colors reference CSS vars, will update automatically
- **`src/components/EducationBadge.tsx`** -- Update badge color scheme to fit purple palette
- **`src/components/BottomNav.tsx`** -- Uses `text-primary`, will update automatically

### Education Badge Colors
Update the badge tier colors to stay within the purple family:
- Consent: Purple (270 60% 50%)
- ENM: Magenta (320 70% 55%)
- Boundaries: Deep violet (285 55% 45%)
- Safer Sex: Rose (340 65% 55%)
- Emotional: Lavender (260 50% 65%)

## What Stays the Same
- All functionality, routing, database logic
- Component structure and layouts
- Success (green) and destructive (red) semantic colors -- these are universal
- Dark mode toggle infrastructure

## Summary of Work
1. Copy brand logo to project assets
2. Rewrite CSS custom properties in `src/index.css` (both light and dark)
3. Update `Logo.tsx` to use the brand image
4. Update gradient class references in page components
5. Adjust education tier colors in `Learn.tsx`

