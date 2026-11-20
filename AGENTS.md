# Access-control rules
- New motion imports only `motion/react`, uses strict LazyMotion and `m` primitives, shared tokens and the existing reduced-motion hook; Learn-only pathname transitions preserve the data router and other tabs.
- All-badge states require a known positive education-module count from the shared one-hour query cache; unknown totals never imply completion, keeping profile trust signals accurate.
- XP awards are serialized per caller and validated by source, proof, repeat window, and UTC ceiling; clients display only the returned awarded amount.
- Daily rewards belong only on Learn home; session dismissal prevents automatic reopening and user/date seeding keeps the reward stable.
- Use the shared badge-aware module completion helper and XP threshold function so lesson, path, and server progress agree.
- Mount cookie consent inside router context to suppress it on lesson routes, and register visual demo routes only in development.
- Load learning questions through `get_quiz_questions` and grade individual answers through `check_quiz_answer`; only server mastery completion results determine new badges, final scores, and quiz XP; retain `submit_quiz` for legacy clients, so answer keys never accompany question loading.
- Video-event reads require authentication and either a future upcoming/active listing or participation; preserve separate administrator management so members can discover events without seeing unrelated event history.
- Sprint participation reads are limited to the caller's own records and sprints they have joined; use the caller-bound `is_sprint_member` definer helper to avoid recursive RLS while preserving member leaderboards.
- Use a browser data router at the app root so profile unsaved-navigation blocking via `useBlocker` has its required context; retain the existing descendant routes and providers.
- Learn home shares one next-learning target between the path and pinned bar, and lazy-loads existing daily activity panels in sheets; this preserves lesson entry and reward logic without competing cards.
- Level nodes and lesson deep links derive unlocks from ordered section completion; Guides cache server counts for one hour and tier reviews use safe server questions and existing daily XP deduplication without badge submission.
- Card lessons split unchanged source text with the pure lessonCards helper; position writes are serialized and retry off-screen, while completion awaits markComplete before validated section XP. Article view shares the same grading and completion flow.

- Badge checks requeue missed questions with original option indexes, complete server mastery before XP, and skip badge/XP writes in earned-badge review; tier reviews retain their existing one-pass reward flow.

- Learn finishes use a lazy full-screen ordered sequence and transient router completion state; completion precedes XP and in-memory retries survive navigation without duplicate rewards.

- Mixed path nodes derive mandatory unlocks only from lessons; optional completion uses scenario progress, server chest receipts, XP records and private preference receipts for zero-award practice/listen sessions; Story lookup is module-scoped in every tier.

- Path presentation uses shared raised PathNode/popovers, inline SVG art and visibility-gated loops; synthesised learning sounds share existing preferences, gesture gating and deduplication without changing progress rules.

- Practice hub/modes lazy-load separately from Path; private saved takeaways and safe caller-eligible RPCs keep answer keys off loading, and award_practice_xp serializes daily rewards without badge writes or changes to legacy award_xp.

- Learn artwork uses manifest-sized GuideArt with lazy images and visibility-gated floats; Learn-only mascot adapters preserve non-Learn legacy art.

- App character art uses the merged dimension manifests and a pure user/local-day/meaning selector; viewport/gesture-gated loading limits initial artwork requests, and sharing waits for image decoding and the wordmark font.
