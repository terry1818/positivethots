# Learn 12 — supplied character artwork

Practice work was committed as 3463f9b before Learn 12 began.

## Six acceptance checks
1. PASS: All 24 WebPs and manifest.json are present at src/assets/guides/, byte-for-byte identical to the supplied zip. All 24 names have a contextual use. No art was re-encoded, recoloured, cropped or redrawn; old files retained.
2. PASS with progression limitation: Real signed-in path shows reading beside current Lesson 2 and Story beside the next special spot. Scrolling further switches that special art to graduate. Maximum two images per expanded level verified. Selected-node popovers also update the contextual primary artwork. Fresh mandatory lesson completion was not performed for this presentation-only request; existing progress logic is unchanged. At 375px art is 112px; under 360px CSS changes height to 88px. Completed-level high-five is first-appearance/session limited and lasts 2.5 seconds; transient badge completion uses the same duration.
3. PASS: Each of the five tier banners was scrolled into view and its distinct data-guide verified; Foundation, Sexual Health, Identity, Relationships and Advanced. Real module Guide sheet showed the Sexual Health art. Headers use 96px art.
4. PASS: Real server-graded rapid answers produced both feedback states. Correct shows guide-thumbs-up, missed shows guide-encourage. Reviewed mobile/desktop screenshots; no character/text/control overlap.
5. PASS local: Manifest width/height reserved before loading; rendered aspect ratios match native art. Exactly three supplied images acquired src before interaction on initial /learn at 375px. Below-fold images wait for actual intersection; floats stop off-screen and in hidden tabs. Reduced-motion check found zero floating images. Local scroll observation: CLS 0, average frame 16.68ms (about 60fps), max 33.3ms; not a guarantee on physical devices or production. No horizontal overflow at tested widths and no console/page errors in final flows.
6. PASS normal and fallback Learn surfaces: No child-like old images rendered on checked Learn path, lessons, practice or feedback. Learn-only adapters replace graduate/confused/shrug and other moods, explicit empty/error illustrations include TierReview/ScenarioPlayer, and Learn has a new-art ErrorBoundary fallback. Shared non-Learn art defaults unchanged.

## Visual verification and iterations
Inspected every supplied character in a contact sheet. Reviewed 375px and 1280px path, tier banners, feedback and finish screenshots, plus Practice and actual card Lesson 1. Enlarged feedback art to 112px and finish art to 160–176px. Moved right-side path art outward to avoid locked-node overlap. Saturated locked tappable nodes rather than dull gray. Kept raised lips/filled icons/press states. Added strict initial-load budget after initial browser evidence showed six downloads. Finished a real ten-card Practice flow after the existing cap: actual zero XP and cap note remained unchanged. Checked daily-spin and module Guide sheets. Reflection art was observed in real article view; card view switch showed guide-waving. No new badge or lesson completion was performed. Viewing preference changed back to cards and lesson position may be resaved by existing auto-save.

## Outside Learn — remaining older images
- mascot-confused.png: Profile load-error state (src/pages/Profile.tsx), EditProfile load-error state (src/pages/EditProfile.tsx), global ErrorBoundary default (src/components/ErrorBoundary.tsx, now intercepted for errors within Learn).
- mascot-shrug.png: NotFound (src/pages/NotFound.tsx).
- mascot-graduate.png: shared Mascot graduate mapping and shared BrandedEmptyState graduate option remain available; no current explicit outside-Learn page caller chooses graduate. Shared MascotReaction `proud` maps to graduate; generic CelebrationEngine medium celebration uses proud, though its current active callers are Learn and now provide art or confetti-only.
- Shared MascotReaction also retains confused for thinking/surprised and shrug for empathetic/worried/sleeping; no direct current outside-Learn page caller found. These shared defaults intentionally remain.

## Placement coverage
Path seven contextual node illustrations, trophy Tier Review, high-five completion; five tier headers and module Guides; lesson title and reflection; quiz thinking corner and distinct correct/missed feedback; all named FinishSequence stages including full-width celebrate-all; streak/risk, daily spin/bonus, weekly/community sheets; Listen recap; Practice header and three tiles; all-badge Learn celebration uses cached positive module total.

## Code/data scope
No database, permissions, edge functions, lesson text, badge, XP or unlock rule changes. Shared BrandedEmptyState/CelebrationEngine accept optional art, retaining old defaults elsewhere. New GuideArt/LearnMascot; Learn route error fallback, Learn/Practice/TierReview pages, education presentation components, Learn-only daily bonus, semantic CSS and architecture/roadmap documentation. All 24 raw files intentionally source-controlled per explicit supplied destination.

60 existing tests passed. Latest harness build OK. Not published. Unexercised live states: fresh badge→tier/all-badge completion, streak-risk/level-up/reflection save, chest claim and fresh lesson progression; contextual mappings are implemented, but these were not triggered by changing user data just for art verification.
