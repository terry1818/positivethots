
# Add Abstract Background Visuals to Auth Page

## Overview
Add CSS-only abstract decorative elements to the auth/login page using the existing purple/magenta palette. These will be animated gradient orbs and soft bokeh-style blurs that float behind the login card, adding depth and visual interest without any external assets.

## What Gets Added

**Decorative background elements in `src/pages/Auth.tsx`:**
- 3-4 large, blurred gradient circles (orbs) positioned absolutely behind the card
- Colors pulled from the existing palette: primary purple, secondary magenta, accent violet
- Subtle CSS animation (slow drift/pulse) so they feel alive but not distracting
- A faint radial gradient overlay to add depth

**New CSS keyframes in `src/index.css`:**
- A slow `float` animation that gently moves the orbs in a looping pattern
- Each orb gets a different animation delay for organic movement

## Technical Details

### Auth.tsx Changes
- Wrap the existing content in a `relative overflow-hidden` container
- Add 3-4 `div` elements with absolute positioning, large dimensions (300-500px), rounded-full, heavy blur (blur-3xl), and low opacity (10-20%)
- Each orb uses a different gradient from the palette (e.g., `bg-primary`, `bg-secondary`, `bg-accent`)
- The login card stays on top via `relative z-10`

### index.css Changes
- Add a `@keyframes blob-float` animation that translates and scales subtly over 15-20 seconds
- Three animation delay variants so orbs move independently

### Example orb structure:
```text
div.absolute.-top-20.-left-20.w-96.h-96.rounded-full.bg-primary/15.blur-3xl.animate-blob-float
div.absolute.-bottom-20.-right-20.w-80.h-80.rounded-full.bg-secondary/20.blur-3xl.animate-blob-float [delay 5s]
div.absolute.top-1/2.left-1/2.w-72.h-72.rounded-full.bg-accent/10.blur-3xl.animate-blob-float [delay 10s]
```

## Files to Modify
- `src/pages/Auth.tsx` -- add decorative orb divs behind the card
- `src/index.css` -- add `blob-float` keyframe animation
- `tailwind.config.ts` -- register the `blob-float` animation

## What Stays the Same
- All auth logic, form fields, validation
- Logo placement and size
- Card styling and layout
