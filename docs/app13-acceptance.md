# App 13 — Character artwork acceptance report

## Result
Installed all 23 alternate WebP files and manifest unchanged. No database, pricing, payment functions, or routes changed. Build passed; 64 tests passed. Not published.

## Acceptance checks
1. **Pass:** all 23 alternates plus manifest match the zip byte-for-byte. All dimensions match the actual images. Pure user ID/local-day/meaning hashing is stable; signed-out rotation and session-day stability are covered. 47 total images.
2. **Pass:** zero source references to mascot-confused, mascot-graduate, mascot-shrug, mascot-waving.png, or mascot-heart.png. Original files retained.
3. **Partially verified:** signed-in Discovery empty, Messages empty, Profile XP, Profile edit, Premium, Wallet, Events, Journal, Likes, Resources, testing pages, cancellation, onboarding welcome, and public auth/reset/404 were inspected. Small dialog/tour/leaderboard/reward/game-intro mappings implemented. Purchase success and RSVP artwork use existing confirmation areas where available; no purchase, RSVP, consent, photo, or profile write was performed. No Thot Pack/Boost purchase sheet exists in current source; checkout redirects were not changed. Discovery currently explicitly permits browsing without Foundation completion, so there is no locked screen to decorate; the gate logic was not changed. Onboarding final/learning introduction mappings inspected in source, not completed live. Free-member Likes lock, zero/all-badge states, welcome-back reward and survey variants were not exercised with real records.
4. **Pass in inspected paths/source:** no new artwork on member cards/detail sheets or inside message threads. Game art is in the pre-game menu only. Eight signed-in settings/legal routes had zero rendered guide images; reporting/verification/age/admin code unchanged. GuideArt suppresses artwork on excluded path prefixes, including global banners.
5. **Pass:** generated square achievement image contains decoded guide-graduate and the Pacifico wordmark. Export waits for image decoding and font loading; unavailable images block export and offer Retry. Streak, level and all-badge meanings mapped. Both canvas formats draw artwork.
6. **Partially verified:** ordinary inspected routes had no page errors or horizontal overflow at 375px; build passed. Fixed manifest dimensions reserve artwork space. First artwork gets an initial-load slot; additional visible art is deferred until a gesture or after the first second. Floats pause outside the viewport/hidden tabs; reduced-motion screenshots show still artwork and fade only. Local/production LCP and CLS targets were not measured, and full screen-reader/contrast audits were not performed. Existing 404 diagnostic console logging remains unchanged. First-paint request counts were controlled in source but not separately network-measured across every route.
7. **Pass:** complete changed-file list below.

## Screenshot review and iteration
Reviewed ten requested 375px views plus desktop auth and shared export. Corrected Discovery's centered scroll clipping, reduced the Events header art, suppressed the extra header image during tours, reserved secondary art loads, fixed the existing reduced-motion heart overlay covering celebration text, and increased shared-image artwork size. Art uses contain sizing and never overlaps photos or buttons. Profile capture is scrolled to the actual level/XP area; connection celebration uses a visual fixture with a placeholder portrait and does not create a connection. Main action remains reachable by scrolling on shorter mobile screens. Existing app light/system theme was preserved.

## Screenshots supplied
Auth; Discovery empty; You Both Said Yes; Messages empty; Profile XP; Premium; Wallet; Events; Journal; 404; desktop auth; shared achievement.

## Every changed file
- `AGENTS.md`
- `docs/app13-acceptance.md`
- `public/guides/guide-celebrate-all.webp`
- `public/guides/guide-graduate.webp`
- `public/guides/guide-high-five.webp`
- `public/guides/guide-lesson-reading.webp`
- `public/guides/guide-tier-relationships.webp`
- `public/landing.html`
- `roadmap.md`
- `src/assets/guides/guide-celebrate-all-b.webp`
- `src/assets/guides/guide-chest-open-c.webp`
- `src/assets/guides/guide-daily-spin-b.webp`
- `src/assets/guides/guide-daily-spin-c.webp`
- `src/assets/guides/guide-encourage-c.webp`
- `src/assets/guides/guide-graduate-c.webp`
- `src/assets/guides/guide-lesson-reading-b.webp`
- `src/assets/guides/guide-lesson-reading-c.webp`
- `src/assets/guides/guide-level-up-b.webp`
- `src/assets/guides/guide-meditate-b.webp`
- `src/assets/guides/guide-meditate-c.webp`
- `src/assets/guides/guide-sleepy-b.webp`
- `src/assets/guides/guide-story-chat-c.webp`
- `src/assets/guides/guide-streak-flame-b.webp`
- `src/assets/guides/guide-streak-flame-c.webp`
- `src/assets/guides/guide-thinking-b.webp`
- `src/assets/guides/guide-thinking-c.webp`
- `src/assets/guides/guide-thumbs-up-b.webp`
- `src/assets/guides/guide-tier-foundation-b.webp`
- `src/assets/guides/guide-tier-foundation-c.webp`
- `src/assets/guides/guide-tier-identity-b.webp`
- `src/assets/guides/guide-tier-identity-c.webp`
- `src/assets/guides/guide-waving-b.webp`
- `src/assets/guides/manifest-alternates.json`
- `src/components/BrandedEmptyState.tsx`
- `src/components/ErrorBoundary.tsx`
- `src/components/ForgotPasswordModal.tsx`
- `src/components/MatchModal.tsx`
- `src/components/NpsModal.tsx`
- `src/components/OfflineBanner.tsx`
- `src/components/ShareableAchievementCard.tsx`
- `src/components/SpotlightTour.tsx`
- `src/components/WelcomeBackBanner.tsx`
- `src/components/WelcomeBackModal.tsx`
- `src/components/celebrations/CelebrationEngine.tsx`
- `src/components/chat/GameMenu.tsx`
- `src/components/coins/CoinPurchaseSheet.tsx`
- `src/components/education/sprints/SprintLeaderboard.tsx`
- `src/components/group-chat/GroupChatList.tsx`
- `src/components/mascot/GuideArt.tsx`
- `src/components/mascot/Mascot.tsx`
- `src/components/onboarding/ValuePropositionScreen.tsx`
- `src/index.css`
- `src/lib/guideAssets.ts`
- `src/lib/guideRotation.ts`
- `src/lib/shareableCard.ts`
- `src/pages/Auth.tsx`
- `src/pages/Cancellation.tsx`
- `src/pages/Chat.tsx`
- `src/pages/EditProfile.tsx`
- `src/pages/Events.tsx`
- `src/pages/HealthTesting.tsx`
- `src/pages/Index.tsx`
- `src/pages/LearningJournal.tsx`
- `src/pages/LikesYou.tsx`
- `src/pages/Messages.tsx`
- `src/pages/NotFound.tsx`
- `src/pages/Onboarding.tsx`
- `src/pages/Premium.tsx`
- `src/pages/Profile.tsx`
- `src/pages/ResetPassword.tsx`
- `src/pages/Resources.tsx`
- `src/pages/TestingLocator.tsx`
- `src/pages/Wallet.tsx`
- `tailwind.config.ts`
- `tests/guide_rotation.test.ts`
