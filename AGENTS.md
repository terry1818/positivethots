# Access-control rules
- New motion imports only `motion/react`, uses strict LazyMotion and `m` primitives, shared tokens and the existing reduced-motion hook; Learn-only pathname transitions preserve the data router and other tabs.
- All-badge states require a known positive education-module count from the shared one-hour query cache; unknown totals never imply completion, keeping profile trust signals accurate.
- XP awards are serialized per caller and validated by source, proof, repeat window, and UTC ceiling; clients display only the returned awarded amount.
- Daily rewards belong only on Learn home; session dismissal prevents automatic reopening and user/date seeding keeps the reward stable.
- Use the shared badge-aware module completion helper and XP threshold function so lesson, path, and server progress agree.
- Mount cookie consent inside router context to suppress it on lesson routes, and register visual demo routes only in development.
- Load learning questions through `get_quiz_questions` and grade individual answers through `check_quiz_answer`; only server mastery completion results determine new badges, final scores, and quiz XP; retain `submit_quiz` for legacy clients, so answer keys never accompany question loading.
- Video-event listings are restricted by RLS to authenticated users with a non-null auth.uid(); preserve the separate administrator management policy so event browsing stays available to members without exposing the listing anonymously.
- Sprint participation reads are limited to the caller's own records and sprints they have joined; use the caller-bound `is_sprint_member` definer helper to avoid recursive RLS while preserving member leaderboards.
- Use a browser data router at the app root so profile unsaved-navigation blocking via `useBlocker` has its required context; retain the existing descendant routes and providers.
- Learn home shares one next-learning target between the path and pinned bar, and lazy-loads existing daily activity panels in sheets; this preserves lesson entry and reward logic without competing cards.
- Level nodes and lesson deep links derive unlocks from ordered section completion; Guides cache server counts for one hour and tier reviews use safe server questions and existing daily XP deduplication without badge submission.
- Card lessons split unchanged source text with the pure lessonCards helper; position writes are serialized and retry off-screen, while completion awaits markComplete before validated section XP. Article view shares the same grading and completion flow.

- Badge checks requeue missed questions with original option indexes, complete server mastery before XP, and skip badge/XP writes in earned-badge review; tier reviews retain their existing one-pass reward flow.
