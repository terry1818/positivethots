

# Improve Education Section Contrast

## Problem
In dark mode, the module cards, tier headers, and text all blend into the background because:
- Background lightness is 8% and card lightness is 12% -- only 4% difference
- Tier header gradients use very low opacity (10-15%) making them nearly invisible
- Muted foreground text at 60% lightness is too dim against the dark background
- The progress card and info card have no visible borders and near-invisible gradient tints

## Changes

### 1. `src/index.css` -- Increase dark mode contrast
- Bump card lightness from 12% to 15% (more visible separation from 8% background)
- Increase border lightness from 22% to 28% so card edges are visible
- Bump muted-foreground from 60% to 68% for better text readability

### 2. `src/pages/Learn.tsx` -- Stronger visual differentiation for cards and tiers
- **Tier header buttons**: Increase gradient opacity from `/10` and `/5` to `/20` and `/10`, and add a subtle border
- **Module cards**: Add a left border accent color matching the tier, making each card visually pop
- **Progress card**: Add a visible border and increase gradient opacity from `/10` to `/20`
- **Info card ("Why Education First?")**: Add a border and slightly stronger background

### 3. `src/components/education/SectionContent.tsx` -- Better section content contrast
- Ensure section header text uses `text-foreground` instead of `text-muted-foreground` for key labels
- Add a card wrapper around the section content area so it stands out from the page background

### 4. `src/components/education/SectionNav.tsx` -- Stronger nav pill contrast
- Increase the inactive pill background opacity so they're more visible in dark mode

## Technical Details

### CSS variable changes (dark mode only):
| Variable | Current | New |
|----------|---------|-----|
| `--card` | `270 20% 12%` | `270 20% 15%` |
| `--border` | `270 15% 22%` | `270 15% 28%` |
| `--input` | `270 15% 22%` | `270 15% 28%` |
| `--muted` | `270 15% 18%` | `270 15% 20%` |
| `--muted-foreground` | `270 10% 60%` | `270 10% 68%` |

### Learn.tsx tier config changes:
- `bgClass` values go from `from-X/10 to-X/5` to `from-X/20 to-X/10`
- Module cards get `border-l-4 border-l-[tier-color]` for visual anchoring
- Progress card changes from `border-0` to explicit border with gradient

### What stays the same:
- All functionality, routing, data loading
- Light mode theme (no changes needed -- it already has good contrast)
- Logo, badges, animations

