# Access-control rules
- XP awards are serialized per caller and validated by source, proof, repeat window, and UTC ceiling; clients display only the returned awarded amount.
- Daily rewards belong only on Learn home; session dismissal prevents automatic reopening and user/date seeding keeps the reward stable.
- Use the shared badge-aware module completion helper and XP threshold function so lesson, path, and server progress agree.
- Mount cookie consent inside router context to suppress it on lesson routes, and register visual demo routes only in development.
- Load learning questions through `get_quiz_questions` and grade individual answers through `check_quiz_answer`; only `submit_quiz` results determine badges, final scores, and quiz XP, so answer keys never accompany question loading.
- Video-event listings are restricted by RLS to authenticated users with a non-null auth.uid(); preserve the separate administrator management policy so event browsing stays available to members without exposing the listing anonymously.
- Sprint participation reads are limited to the caller's own records and sprints they have joined; use the caller-bound `is_sprint_member` definer helper to avoid recursive RLS while preserving member leaderboards.
- Use a browser data router at the app root so profile unsaved-navigation blocking via `useBlocker` has its required context; retain the existing descendant routes and providers.