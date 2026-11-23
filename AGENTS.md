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
- Interactive character and path effects are decoration only: one shared frame-throttled pointer store (`src/lib/pointerFx.ts`), CSS transforms through `translate`/`scale` so Tailwind transforms keep working, gated by visibility, `prefers-reduced-motion`, and no pointer tracking on touch-only or low-power devices; characters react to learning events through the `pt:react` event that the learning sounds emit, and nothing interactive is required to use a screen.
- Rich lessons read their extras from one file per module (`src/content/lessons/<module-slug>.json`, fetched when the module opens; illustrations in `src/assets/lessons/<module-slug>/`): pictures that show the idea on the card, a memory aid, the lead sentence shown larger and ungraded recall questions that award nothing and so are checked on the device. Lesson text is never rewritten, a lesson with no entry renders as a plain card lesson, and each rule traces to `docs/lesson-design-evidence.md`.
- Plain language in Learn: each card may carry a `plain` line ("In plain words", shown before the lesson text, never replacing it), and words listed in `src/content/glossary.json` are underlined once per card and explain themselves on tap through `GlossarySheet`. Mount a `GlossarySheet` wherever `renderMarkdown` output is shown.
- The lesson-complete screen celebrates with confetti, a five-note fanfare (`lessonComplete`) and cheering characters that take turns (`CelebrationCast`); reduced motion shows one still character and no confetti.
- Lesson text corrections ship in the repo: `src/content/lesson-text/index.json` (which lessons, and corrected titles) and `src/content/lesson-text/modules/<module-slug>.json` (corrected text with a fingerprint of the stored text it replaces). `src/lib/lessonText.ts` applies them wherever `module_sections` text or titles are read, and only while the database still holds the exact text or title the correction was written against, so an admin edit always wins. New lesson reads must go through `patchSections`, `lessonText` or `lessonTitle`. Rules for the text itself are in `docs/lesson-text-corrections.md`: every lesson ends with a `Try It Tonight` step, lessons about harm or crisis end with the standard `If You Need Help Now` card, sections speak to people who are dating, have one partner or have several, and no statistic goes in without a source that was checked.
