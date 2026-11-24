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
- Foundation is the required tier, so every Foundation module must apply to every member whatever their relationship style. Which modules are in it is data (`education_modules.tier`, `is_required`, `order_index`), never a list in code: Foundation unlocks in `order_index` order, and every other tier unlocks from `prerequisite_badges` once the required Foundation modules are earned. CNM Foundations is a required Identity module (`is_required` true) that counts toward that tier and its rewards, and Jealousy & Insecurity and The New Monogamy keep it as a prerequisite (owner's decisions, November 2026). Outside Foundation `is_required` is a label only: the gate for later tiers is always `tier = 'foundation'` plus `is_required`, in Learn, Index and useRequireAuth alike, so a required module in a later tier can never lock that tier behind itself.

## App look outside Learn

- Screens outside Learn use the app kit at the end of `src/index.css`; the pieces and rules are in `docs/app-kit.md`. Put one `kit-area-*` class on the page root and build with `kit-*` classes instead of new one-off styles.
- No character art on another member's card or inside a message thread. One `kit-cta` per screen.
- Outside Learn, animate with CSS. `motion/react` components only animate inside the Learn layout.
- Sounds go through `useSoundEffects`. Never show a reward the app does not grant, and never quote a figure in app copy ("3× more Connects") without a source.
- Daily spin: the server picks and grants the prize (`claim_daily_spin_v2`); the app animates to the wedge it is told. `SPIN_REWARDS` and `SPIN_WEIGHTS` in `src/lib/spinWheel.ts` must match the SQL (12 wedges, tiers, chances, streak bonus on XP), and a test checks it. Every prize is listed with its chance under "What can I win?". Its sounds are recorded files rendered by `scripts/make_spin_sounds.py`; change the script, not the files.
- Thots: today's free ones live in `super_like_balance.daily_remaining`, earned or bought ones in `balance` (never reset). The allowance comes from the plan on the server (free 1, Plus and Premium 5, VIP unlimited). Send one only through `send_thot`. Never write these tables from the app.
- A streak or level reward shown in the app must be one `grant-streak-reward` or `grant-level-reward` really grants.
- A Profile Boost lasts 24 hours. Say 24 hours wherever it is described.
- A tour or notice a member has already dealt with must not come back. Tours go through `useTutorialState` (do not open one until `seen` is known to be false); the cookie notice waits for sign-in to settle and checks the device and the account.
- Pages built as a flex column give each centred section `w-full`, and the text side of a row gets `min-w-0`. Base text is 18.9px, so check layouts at 320 to 393 pixels wide.
- Discover fits one phone screen and does not scroll (`discover-screen`). Pass, Send a Thot and Connect stay visible under the card with their names; do not put anything between the card and those three. A failed load shows its own error state, never the empty state.
- Dragging a card: only a pressed pointer drags, and a drag is never also a tap. Do not move the card's arrival animation back onto the slot element; it would stop the card following the finger.
- Tour tips (`SpotlightTour`) must stay on screen at 320 to 430 pixels wide; point a step at something smaller than the screen.
- Connects (route `/likes`): the tab is named "Connects". The word "like" is never shown to a member; the action is always Connect. A Connect made from Likes is mutual, so it opens "You Both Said Yes".
- Payments: `src/lib/payments.ts` holds `PAYMENTS_OPEN`. While it is false, no screen may show a button that starts a checkout (plans, tickets, codes, gifts, group plans, coins). Show the price and "Opens soon". Flip it in the same change that wires the new processor's checkout. Never add Stripe.
- The member's plan comes from the `subscriptions` table (`pickActivePlan` in `useSubscription`), the same rows the server reads. Seeing who wants to connect is included in every plan, so upsells name Plus ($4.99 a month).
- Wallet shows only what a member really holds (Thots, Streak Freezes, Double XP, Profile Boosts, Mystery Match Reveals, frames). Thots Coins stay hidden while `COINS_LIVE` is false: nothing grants a coin and nothing a coin buys is delivered.
- Events: a failed load has its own state; the search box appears only with more than three events; paid tickets follow `PAYMENTS_OPEN`.
- Chat: a conversation is `chat-screen` (phone height, only the messages scroll). No control without a working feature behind it. Report stays one tap from the header. No policy footer under the composer.
- Never load a member's fallback picture from another service; show their initial.
- Sign-up and onboarding are written for everyone: no question about one relationship style, no "Popular" label without data, no looping background animation.
- `tests/app_kit.test.ts` guards area-colour contrast, the wheel landing on its prize, and the profile completion steps. Keep it passing.
