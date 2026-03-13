

# Revamped Onboarding Flow — Polished, Fluid, Feature-Rich

## Overview

Completely rebuild the onboarding into a smooth, animated multi-step experience that combines the best profile fields from Tinder, Bumble, Feeld, and 3fun. The flow will feel modern and app-like with transitions, progress indicators, and rich selection UIs.

## Current State

The existing onboarding has 8 steps collecting: pronouns, gender, relationship style, relationship status, looking for, experience level, location, interests, bio, and boundaries. It works but feels basic — plain radio buttons, no animations, limited options, no photos, no sexuality, no desires, no height, no lifestyle badges.

## New Onboarding Steps (12 steps, grouped into phases)

### Phase 1 — Identity (Steps 1-3)
1. **Welcome + Name confirmation** — Animated welcome screen with the user's name, sets the tone
2. **Gender identity** — Expanded list: Woman, Man, Non-binary, Trans Woman, Trans Man, Genderqueer, Genderfluid, Agender, Two-Spirit, Intersex, Other (inspired by Feeld's 15+ genders)
3. **Pronouns** — Quick-select chips (she/her, he/him, they/them, she/they, he/they, any pronouns) + custom text input

### Phase 2 — Sexuality & Desires (Steps 4-5)
4. **Sexuality** — Multi-option selection: Straight, Gay, Lesbian, Bisexual, Pansexual, Queer, Bicurious, Demisexual, Asexual, Heteroflexible, Homoflexible, Fluid, Questioning, Other (Feeld-inspired)
5. **Desires** — Tag-style multi-select (up to 10): Dates, Casual, FWB, Friendship, Kink, BDSM, Couples, ENM, Poly, Group, Sensual, Connection, Cuddling, Foreplay, Dom, Sub, GGG, Threeway, Watching (Feeld desires list)

### Phase 3 — Relationship Context (Steps 6-7)
6. **Relationship style** — Keep existing options + add "Hierarchical Poly", "Solo Poly" 
7. **Relationship status** — Keep existing + add "Dating", "Nesting partner", "Separated"

### Phase 4 — About You (Steps 8-10)
8. **Height, Zodiac, Languages** — Height slider (Tinder/Bumble), zodiac sign picker, languages spoken (Bumble badges)
9. **Lifestyle badges** — Multi-select chips for: Smoking, Drinking, Cannabis, Exercise, Diet, Pets, Kids (Bumble/Tinder lifestyle badges)
10. **Interests** — Expanded interest tags (30+ options across categories: Activities, Creative, Social, Wellness, etc.) with animated selection

### Phase 5 — Your Story (Steps 11-12)
11. **Bio + Boundaries** — Rich text areas with character count, placeholder prompts, writing tips
12. **Photos + Location** — Photo upload grid (reuse existing PhotoUploadGrid), location input, and a profile preview before finishing

## Database Changes

New columns on `profiles` table via migration:
- `sexuality` (text, nullable)
- `desires` (text[], nullable) 
- `height_cm` (integer, nullable)
- `zodiac_sign` (text, nullable)
- `languages` (text[], nullable)
- `lifestyle` (jsonb, nullable) — stores smoking/drinking/exercise/diet/pets/kids preferences
- `display_name` (text, nullable) — optional display name different from real name

## UI/UX Enhancements

- **Animated transitions** between steps using CSS transitions (slide left/right based on direction)
- **Phase headers** showing which section you're in (Identity → Sexuality → Relationship → About You → Your Story)
- **Skip buttons** on optional steps (height, zodiac, lifestyle, desires)
- **Smart progress bar** showing phase completion, not just step count
- **Contextual help tooltips** — tap-and-hold on terms like "ENM", "GGG", "Solo Poly" to see definitions (Feeld glossary style)
- **Profile preview card** at the final step so users see how their profile will appear to others before submitting
- **Mobile-first** card layout with smooth gesture-friendly design

## Files Changed/Created

| File | Action |
|------|--------|
| DB migration | Add sexuality, desires, height_cm, zodiac_sign, languages, lifestyle columns |
| `src/pages/Onboarding.tsx` | Complete rewrite with 12-step animated flow |
| `src/components/onboarding/StepTransition.tsx` | Create — animated step wrapper |
| `src/components/onboarding/GlossaryTooltip.tsx` | Create — tap-hold term definitions |
| `src/components/onboarding/ProfilePreview.tsx` | Create — preview card at final step |
| `src/components/onboarding/ChipSelector.tsx` | Create — reusable animated chip/tag selector |
| `src/components/onboarding/HeightSlider.tsx` | Create — height picker with ft/cm toggle |
| `src/pages/EditProfile.tsx` | Update to include all new fields |
| `src/components/ProfileCard.tsx` | Update to display new fields (sexuality, desires, height, zodiac) |

## Build Error Fix

Will also fix the existing `NodeJS.Timeout` type error in `Chat.tsx` by replacing with `ReturnType<typeof setTimeout>`.

## Technical Notes

- All new profile columns are nullable with no defaults so existing users are unaffected
- The onboarding completion flag (`onboarding_completed`) remains the gate — no change to routing logic
- Photo upload during onboarding reuses the existing `PhotoUploadGrid` component
- Desires are stored as a text array (like interests), enabling future filtering/matching
- Lifestyle is stored as JSONB for flexible key-value pairs (e.g., `{ smoking: "never", drinking: "socially", exercise: "active" }`)

