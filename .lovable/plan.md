

## Plan: Responsive Layouts Across All Pages + Discovery Feed Debug

### Problem 1: Inconsistent Responsive Layouts

Several pages use fixed `max-w-md` which looks cramped on larger screens, while Messages and LikesYou already use the responsive pattern `max-w-md md:max-w-2xl lg:max-w-4xl`. The following pages need updating:

| Page | Current | Target |
|------|---------|--------|
| `Index.tsx` | `max-w-md` (7 occurrences) | `max-w-md md:max-w-2xl lg:max-w-4xl` |
| `Learn.tsx` | `max-w-md` (2 occurrences) | `max-w-md md:max-w-2xl lg:max-w-4xl` |
| `Profile.tsx` | `max-w-md` (2 occurrences) | `max-w-md md:max-w-2xl lg:max-w-4xl` |
| `Settings.tsx` | `max-w-md` (2 occurrences) | `max-w-md md:max-w-2xl lg:max-w-4xl` |
| `EditProfile.tsx` | `max-w-md` (2 occurrences) | `max-w-md md:max-w-2xl lg:max-w-4xl` |
| `TestingLocator.tsx` | `max-w-md` (2 occurrences) | `max-w-md md:max-w-2xl lg:max-w-4xl` |
| `HealthTesting.tsx` | `max-w-md` (2 occurrences) | `max-w-md md:max-w-2xl lg:max-w-4xl` |
| `ProductDetail.tsx` | `max-w-md` (4 occurrences) | `max-w-md md:max-w-2xl lg:max-w-4xl` |
| `Events.tsx` | `max-w-2xl` (1 occurrence) | `max-w-md md:max-w-2xl lg:max-w-4xl` |
| `LearningJournal.tsx` | `max-w-2xl` (1 occurrence) | `max-w-md md:max-w-2xl lg:max-w-4xl` |
| `LearnModule.tsx` | `max-w-2xl` (2 occurrences) | `max-w-md md:max-w-2xl lg:max-w-4xl` |

Pages already correct: Messages, LikesYou, Chat (`max-w-4xl`), Premium (`max-w-4xl`), Resources (`max-w-6xl`).

For each page, replace ALL `max-w-md` or `max-w-2xl` container classes with the responsive pattern.

### Problem 2: Discovery Profiles Not Loading After Feed Reset

I investigated thoroughly:
- The `get_discovery_profiles` RPC returns 11 profiles successfully (HTTP 200)
- The `user_photos` query returns approved photos (HTTP 200)
- No network errors detected
- The client-side filtering logic is correct

However, I found a potential issue: **the auto-skip useEffect on lines 222-227** creates a reactive loop that could strip profiles if images fail to load or if there's a brief moment where `profile_image` is falsy during state transitions. This effect is also dangerous because it creates an infinite loop risk — each `setSuggestions` triggers the effect again.

**Fix:** Remove the auto-skip `useEffect` entirely. It's redundant because:
1. `loadSuggestions` already filters profiles with the `hasPhoto` check on line 354-357
2. If a profile somehow gets through without a photo, the `SwipeDiscoveryCard` already handles the fallback (line 209-212 shows a gradient letter)

Additionally, the `SwipeDiscoveryCard` has `max-w-sm` on line 177 which should expand on larger screens. Change to `max-w-sm md:max-w-md` so cards look better on wider viewports.

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Responsive containers + remove auto-skip useEffect |
| `src/pages/Learn.tsx` | Responsive containers |
| `src/pages/Profile.tsx` | Responsive containers |
| `src/pages/Settings.tsx` | Responsive containers |
| `src/pages/EditProfile.tsx` | Responsive containers |
| `src/pages/TestingLocator.tsx` | Responsive containers |
| `src/pages/HealthTesting.tsx` | Responsive containers |
| `src/pages/ProductDetail.tsx` | Responsive containers |
| `src/pages/Events.tsx` | Responsive containers |
| `src/pages/LearningJournal.tsx` | Responsive containers |
| `src/pages/LearnModule.tsx` | Responsive containers |
| `src/components/discovery/SwipeDiscoveryCard.tsx` | Responsive card width |

