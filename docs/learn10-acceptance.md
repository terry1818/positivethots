# Learn 10 Practice tab acceptance

## Delivered
- Lazy `/learn/practice` under existing Learn transitions; shared header/XP bar and Path/Practice arrow-key tabs. Existing five-item bottom navigation unchanged.
- Raised, saturated tier tiles with lips, filled icons, PressScale and 6px depth; real existing mascot artwork. Screenshots reviewed at 375px and 1280px in both themes, then iterated for disabled contrast and timer placement.
- Mistakes: latest-attempt eligibility/count, safe loading, server grading, one requeue per missed question, feedback/combo sounds.
- Rapid fire: ten safe server-selected option statements, server grading without performance writes, ten-second timer/skip feedback and persisted timer-off preference.
- Flash cards: completed sections or privately saved takeaways; tap/Space flip, focus transfer and announced answer; reduced-motion fade; one self-rated revisit; five-card minimum reward eligibility.
- Future quick match: independent shuffled term/definition loading, server pair checks and tap/keyboard matching. No fabricated content; tile hidden now.
- Dedicated serialized `award_practice_xp` awards five XP, capped at 30 per UTC day, rejects repeated session keys and also respects existing 400-XP total-day ceiling. No change to legacy `award_xp`, badge or Discovery rules. Reward retries can read an already-saved receipt.

## Acceptance checks
1. **Partial live / passed UI rule:** real signed-in account with seven badges sees hub; zero-badge locked screen verified using browser-only response fixture, plus zero/one-badge unit tests. Temporary regular test-user creation was unavailable; a real zero/one-badge account check remains unverified.
2. **Passed live:** existing server grading created one open mistake; tile showed one; Mistakes session requeued its wrong answer, then the correct answer reduced server count to zero and saved a five-XP finish.
3. **Passed live:** ten rapid items returned only id, question, option_text and option_index. True/False answers server graded; completed ten-item session. Timer off survived reload; enabled timeout displayed the answer and skipped-not-missed notice. Rapid grading has no performance insert.
4. **Passed live:** bookmark from FRIES lesson survived reload and appeared in Saved only; Space and tap flips worked. Reduced-motion transform was none; answer announced. One saved card awarded zero; full ten-card completed-section session ended with accuracy/XP finish. Bookmark retained, no lesson completion changed during bookmark test.
5. **Passed live:** database contains zero drag_match questions; Quick match tile absent. Future actual match session unavailable without content; no content invented.
6. **Passed requesting account / regular role limited:** first Mistakes session awarded five; five subsequent distinct RPC keys brought practice total to 30; seventh and later keys returned awarded=0. Repeating a rewarded key returned 'Practice session already rewarded'. Completed real ten-item Rapid session after cap showed exact cap message; full Flash session also worked after cap. Current injected account has administrator privileges; regular-account end-to-end unavailable. Function has no admin bypass, uses auth.uid, fixed search_path, shared advisory lock and authenticated-only grants. Anonymous execute denied.
7. **Passed live/code regression:** badge module IDs/scores unchanged across cap calls and completed rapid session. All practice flows call only award_practice_xp; never badge/mastery/submit_quiz. Tier/Discovery predicates untouched, existing badge/path regression tests pass.

## Checks and limits
- 60 Bun tests passed, including concrete unlock, five-card minimum, one-requeue, five-XP/30-XP and UTC session-key assertions.
- Harness build checked after final edits.
- Path request observation confirmed Practice hub/mode code not loaded on Path. No page/console errors in tested flows; 375px no horizontal overflow.
- Sound oscillator evidence: node tap 330Hz, card tick 520Hz, node-complete 330/660/880Hz; quiz modes use existing preference-controlled correct/miss/combo sounds.
- Physical-device audio/haptics, production LCP/INP/CLS and fresh regular-user/one-badge acceptance remain unverified.
- Testing persisted 30 practice XP (total 3735→3765), quiz attempts, one saved takeaway, timer-off and article-view preference. No badge/question content changed.

## Server changes
New private table: user_saved_takeaways (own SELECT/INSERT/DELETE only, no UPDATE).
New functions: practice_eligible, get_mistake_questions, get_mistake_count, get_rapid_fire_items, check_rapid_fire, has_match_content, get_match_sets, check_match(uuid,jsonb), award_practice_xp.
The pre-existing connection check_match(uuid,uuid), get_practice_questions and award_xp remain untouched. get_practice_questions is module-specific and five-item limited, so it cannot replace the required global/latest-mistake or ten-item rapid contracts.

## Frontend changes
New PracticeHub, practiceHub helpers/tests, LearnHeader, LearnTabs, PracticeFrame, MistakesPractice, FlashPractice, QuickMatchPractice.
Updated Learn shell, App route, RapidFireExercise (only new hub references it), KeyTakeaway and its two lesson callers, FinishData/FinishSequence message, semantic CSS, AGENTS/roadmap. Types/history generated by migration tool.

Not published; backend changes are active on the shared backend.
