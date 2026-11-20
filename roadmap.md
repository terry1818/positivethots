# Learn 11 path visual and sound upgrade
- [x] Upgrade raised nodes, popovers, trail, mascot/scenery, headers and completion motion without changing learning data or rules.
- [x] Add preference-controlled synthesised sounds and haptics; all nine checks exercised, 55 tests passed. Live lesson saved +10 XP and next node; earned-badge review checked real grading/sounds. Screenshots reviewed in both themes; local frames averaged 16.65ms. Details/limitations in docs/learn11-acceptance.md.

# Learn 09b stories for every module
- [x] Draft and insert 32 lesson-grounded stories; create docs/learn-stories-review.md with all prose, casts, choices and feedback. No app code, schema or function changes; the four existing row hashes are unchanged. Repeat insertion adds zero rows.
- [x] All six acceptance checks passed: 36 rows cover 35 modules; 160 new scenes and 384 choices pass IDs, lengths, destinations, scoring, rotated best positions and prohibited-feedback checks. Signed-in Different Speeds (sexual_health) and Phone at Dinner (advanced) reached real summaries with 8/8 points and four saved choices each; 50 XP each persisted. Five existing mixed-node regression tests and build passed.

# Learn 09 mixed nodes
- [x] Add optional mixed nodes, conversation stories, safe practice RPC, server chest rewards and Foundation listen recap; no new stories or badge/unlock changes. Build and 52 tests passed.
- [x] Checks 1, 4, 5: live Story counts 2/1/1 across three Foundation modules and zero for others; chest +10 XP persisted, duplicate unchanged, locked claim rejected, direct member insert denied (42501).
- [x] Checks 2, 3, 6: real story saved/replayed with no replay XP, five-question practice and two-question listen saved, safe columns/missed-first verified; four sequential audio requests only after Play with short test audio, blocked-audio text fallback and keyboard reveal verified.
- [ ] First-time scenario/practice/listen positive payouts and fresh badge completion after skipping all optional nodes: current member is already at the UTC XP ceiling with all Foundation badges; temporary-user approval unavailable. Exact sources/repeat keys verified live; optional independence and badge unlock verified in tests. Actual cloud speech and 60–90-second recap duration unverified (existing takeaway text is short).

# Learn 08 finish flow
- [x] Add lazy finish sequence for lessons, badges and reviews; actual awarded XP and transient path completion reaction.
- [x] Checks 1, 3, 5–7: real lessons/checkpoints saved, real badges/results/tier sequence, transient state cleared, static reduced-motion/confetti suppression, no stacked celebrations; 47 tests and build passed. Real Tier Review reward outage retried and returned awarded=0 correctly.
- [x] Check 2: first-day/streak and level steps verified with isolated browser fixtures and unit tests; second-day lesson omission verified live. A fresh UTC-day payout was unavailable at the account's current daily ceiling.
- [ ] Check 4 Discovery browsing: final Foundation badge and “Discovery is open” verified live, but the account has no profile row and existing Discovery redirects it to /auth; unrelated profile/onboarding logic left unchanged.

# Learn 07 feedback and mastery
- [x] Add feedback sheets, combo milestones, mastery queue and server completion; preserve legacy submit_quiz and review rewards.
- [x] Checks 1–6 verified: real green/pink non-dismissible focused sheets; original-index shuffled revisit; 3-label and 5-gold; regular-member 80% and 60% badge scores persisted; 50 XP after mastery (later award 0 at existing UTC daily ceiling); incomplete RPC gives remaining with no badge/XP changes; no anti-cheat/tab-switch effects. Badge-save retry, review no badge/XP writes, three-miss real lesson reread and remaining recovery verified; 42 tests/build passed.
- [ ] Check 7: actual last-Foundation Discovery unlock unverified. Temporary-user approval unavailable; requesting member has 3/5 Foundation badges and no profile. Existing Index already browses without a Foundation gate; left unchanged per scope, while preserving checkFoundationComplete. Perfect first badge payout unavailable at current daily ceiling; 100% earned-badge review verified without writes.

# Learn 06 card lesson player
- [x] Split unchanged lesson text into cards, preserve checkpoint grading/completion, add saved position and remembered article view.
- [x] Ran seven checks: title/no overlay, real checkpoint/server wrong-answer continuation plus retry, saved resume, real 10 XP once with completion readback and no repeat call, persisted article choice, keyboard/focus/live announcement, and 35 passing tests. Shortest/mean-nearest/longest sections have 10/12/13 total cards. Actual sections have at most one checkpoint; two-checkpoint placement passes unit tests only. Offline save recovered; 375/390/414/768/1280 and three text sizes verified; local click event 16ms.
- [ ] Production field INP, actual screen-reader audio and cloud read-aloud audio remain unverified; fallback auto-advance used simulated speech end events. No publishing requested.

# Learn 05 module levels
- [x] Add level lesson nodes, Guides, safe count/review RPCs and section/quiz deep links; preserve badge/module gates.
- [x] Run six checks: real regular-member Guide counts, safe RPC fields, locked deep-link fallback and path verified; browser-only progress fixtures verified first level/five nodes, Lesson 1 done/Lesson 2 current, unlocked Section 3 and quiz. Review UI fixture verified 30 then 0 XP requests with daily key and no badge submission. 27 tests passed.
- [ ] Actual fresh lesson/review award persistence and administrator session: temporary-user approval unavailable, requesting regular member has only one tier badge and no profile. No badges or XP were modified for these checks. Admin/regular structure has no role branch, but administrator end-to-end remains unverified.

# Learn 04 path-first home
- [x] Move daily activity cards into lazy sheets, put the winding path first, and share one target with the pinned continue bar.
- [x] Run all six acceptance checks: first mobile node, one bubble/same module target, five sheets, removed pills, tour, and reduced-motion passed. 22 tests/build passed; clean local LCP 448ms, CLS 0.018; no horizontal overflow and desktop path 480px.
- [x] Next-incomplete section entry resolved by Learn 05 section/quiz deep links; bare module URLs retain previous behavior.
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