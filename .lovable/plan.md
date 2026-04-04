
Fix this in three layers so it stops resurfacing:

1. Harden which profiles are allowed into Discovery and Likes
- Stop trusting legacy `profiles.profile_image` as a valid signal by itself.
- In Discovery (`Index.tsx`), only keep profiles that resolve to at least one approved public `user_photos` image after enrichment.
- In Likes, update the data path so both “Likes You” and “Your Likes” resolve their display photo from approved public `user_photos`, then filter out rows with no valid photo.
- Tighten the likes RPCs/mapping so incomplete/bad profile rows do not get rendered just because a swipe record exists.

2. Remove broken profiles at render time too
- Add a client-side guard for image failures:
  - if a profile/tile exhausts all available photos, remove it from the Discovery queue / Likes grid instead of showing a broken-image card.
- This covers storage/file mismatches that the database cannot detect from URL presence alone.

3. Fix the broken Likes profile open flow
- `LikesYou.tsx` currently routes to `/profile/:id`, but the app only has `/profile`.
- Replace that dead navigation with the same full-profile sheet used in Discovery, powered by `get_public_profile`, so liked profiles open correctly and consistently.

4. Make full-profile photos fully visible on larger screens
- In `ProfileDetailSheet.tsx`, stop using crop-first behavior for the full-profile hero.
- Keep crop/focal-point behavior for cards in Discovery, but switch the full-profile viewer to a dedicated media stage that uses full-image display (`object-contain`) on a dark background.
- Increase the viewer height responsively with viewport-based sizing so tall portrait photos remain fully visible top-to-bottom on desktop/tablet/mobile.
- Remove the current “small capped hero” behavior that is still forcing aggressive cropping on larger screens.

5. Files to update
- `src/pages/Index.tsx`
- `src/pages/LikesYou.tsx`
- `src/components/discovery/ProfileDetailSheet.tsx`
- `src/components/BlurImage.tsx` or the sheet image rendering path
- likely one migration to tighten the likes/discovery profile-fetch logic if backend filtering is needed

Technical notes
- The current root causes visible in code are:
  - Discovery still allows `p.profile_image` fallback even when no approved `user_photos` exist.
  - Likes cards use raw `profile_image` data and do not enforce the same photo validity rules as Discovery.
  - Likes tries to open a non-existent `/profile/:id` route.
  - Full-profile view still renders with crop behavior, so large screens cut off the top/bottom of portrait photos.
- I will keep focal-point cropping for feed cards, but the full-profile experience will prioritize seeing the whole image.

Validation checklist after implementation
- Discovery never shows profiles with no valid loadable public photo
- “Likes You” and “Your Likes” no longer show broken/deleted-looking cards
- Tapping a liked profile opens a working full-profile view
- Tall portrait photos are fully visible top-to-bottom in full-profile view on 375px, tablet, and desktop
- Multi-photo profiles still cycle correctly
- One broken image in a carousel skips cleanly; all broken images remove the profile/tile from feed/panel instead of rendering a broken card
