

# Make Header Logos Bigger

## Problem
The logo in page headers uses the `sm` size (`h-8` / 32px), which is too small to be legible.

## Solution
Update the Logo component's `sm` size from `h-8` to `h-12` (48px), and adjust `md` and `lg` accordingly so all size tiers scale up:

| Size | Current | New |
|------|---------|-----|
| sm   | h-8     | h-12 |
| md   | h-12    | h-16 |
| lg   | h-20    | h-24 |

Text sizes will also scale up to match:

| Size | Current | New |
|------|---------|-----|
| sm   | text-lg | text-xl |
| md   | text-2xl | text-3xl |
| lg   | text-4xl | text-5xl |

## File to modify
- `src/components/Logo.tsx` -- update the size maps

## What stays the same
- All pages that use `<Logo size="sm" showText={false} />` automatically get the larger logo with no other changes needed
- Auth and Onboarding pages using `lg` will also benefit from the bump
