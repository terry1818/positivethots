# Learn 04 path-first home
- [x] Move daily activity cards into lazy sheets, put the winding path first, and share one target with the pinned continue bar.
- [x] Run all six acceptance checks: first mobile node, one bubble/same module target, five sheets, removed pills, tour, and reduced-motion passed. 22 tests/build passed; clean local LCP 448ms, CLS 0.018; no horizontal overflow and desktop path 480px.
- [ ] Next-incomplete section entry: existing lesson code always opens Section 1 and the prompt forbids changing /learn/:slug; bar accurately shows Section 2 but both targets open Section 1. Requires permission to change lesson entry.
- [ ] Full reward/sprint/community completion: spin available but not claimed on requesting account; no active sprint or community goal exists. Existing panel logic retained; real calendar, completed challenge, spin control, and empty sheets verified. Field INP unavailable.

# Learn 03 motion foundation
- [x] Add shared motion primitives and mascot artwork without restyling pages; preserve CSS keyframes and sounds.
- [x] Verify real signed-in Learn/module/back transitions and quiz wrong/right artwork; Settings has no motion wrapper. Graduate celebration, sheet focus/Escape, counter start/end, ring ARIA, and reduced primitives passed; 16 tests and build passed.
- [ ] Full production before/after bundle and field performance comparison: harness exposes typecheck success but no production artifacts. Isolated added motion exports measured 93,259 bytes / 34,670 gzip; local Learn LCP 340–460ms and CLS 0.021–0.053. INP field measurement unavailable. Global strict provider is a separate lazy import but required before all page rendering.

# Learn 02c badge count
- [x] Replace badge-total assumptions with the shared database count; preserve Foundation and lower-tier rules.
- [x] Verify 20/35, 35/35, loading/failure and mobile with browser-only component fixtures; real signed-in Learn reads 35. All 13 regression tests and build passed; badge-context searches and public SQL-function/trigger audit found no remaining hardcoded total. No member badge data changed.

# Learn 02b XP integrity
- [x] Restrict award_xp sources, proof, repeats, concurrency, and UTC daily ceiling; preserve historical awards, grants, coin functions, and acceptance of known legacy bonus/multiplier requests (server awards remain capped).
- [x] Update award displays and sequential section completion. Nine tests/build passed; real regular-member rejection, first section 10 XP, parallel duplicates, daily 50/25 XP repeats, legacy quiz/spin requests, and readback verified. Coin functions audited without invoking or changing them.
- [ ] Verify fresh quiz award and first spin/bonus through the full UI on an eligible profile: requesting account has no profile and temporary-user approval unavailable. Daily RPC awards and repeated-claim UI verified with browser-only profile fixtures; existing earned quiz repeat verified.

# Learn 02 small fixes
- [x] Apply all eight scoped reward, takeaway, XP, progress, demo, cookie, mascot, and share-link fixes.
- [x] Run all eight checks: tests/build passed; signed-in takeaway, earned 100%, lesson cookie suppression, authenticated XP thresholds, browser XP display, mascot modes, share text, and published demo checked.
- [ ] Verify daily reward end-to-end on a real eligible profile: requesting account has no profile; temporary-user approval unavailable. Browser-only fixture verified dismissal, lesson absence, return pill, and stable reward; no reward claimed.
- [ ] Verify demo unavailable after publishing: the currently published version still exposes it; development-only route guard is saved but not published.
- [ ] Reproduce the original empty circle in desktop Edge: Chromium showed a small offset mascot, not an empty circle; static cover/top framing verified in both motion modes.

# Compliance copy fixes
- [x] Restore member quiz/checkpoint loading and server grading; verify real-answer submission, retries, private keys, pass/fail, persisted badge, and celebration.
- [ ] Verify an administrator's quiz flow: no administrator session available; requesting account is a regular member and temporary-account approval is unavailable.
- [x] Apply only the requested domain, auth, description, policy, and cancellation-button edits.
- [x] Verify prohibited-copy searches, signup, policy pages, and signed-in Settings. Build reported OK.
- [ ] Verify paid-plan Cancel Subscription click: requesting account is on the free plan; do not change account or payment data.

# Profile-edit crash
- [x] Reproduce the signed-in direct-load error and check history before 1991dff.
- [x] Fix the router context without changing profile copy, layout, or photo consent.
- [x] Verify signed-in direct loading, unsaved navigation, and unchanged consent/photo state.

# Remove merchandise storefront
- [x] Remove storefront links, copy, dead pages, cart code, and deployed proxy without changing other features or database tables.
- [x] Verify build, signed-in Profile, and zero obsolete integration/domain references; existing profile-edit regression also passed with consent/photos unchanged.