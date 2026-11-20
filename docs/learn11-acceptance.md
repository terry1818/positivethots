# Learn 11 — visual and sound acceptance

## Scope
Presentation and synthesised audio only. No dependency, route, unlock, database function, schema or curriculum change. Pinned Continue, Today, Guide and tour hooks retained. Tests exercised existing learning writes: one real lesson completion awarded 10 XP (3735 total), and earned-badge quiz reviews recorded performance; no new badge awarded.

## Acceptance checks
1. **Passed:** raised 72px faces / 88px badge face, 8px lip, filled 34px icons; actual held press measured translateY(6px). Screenshots iterated to correct a faint trail, undersized chest and offscreen mascot.
2. **Passed:** live current/done/locked states plus isolated premium-locked state; check/star, progress ring and lock/crown differentiate without colour alone.
3. **Passed:** real lesson card Continue opened `/learn/pleasure-satisfaction?section=1`; Escape returned focus. Locked and premium cards had zero action buttons; outside dismissal checked. Tier review, story/practice/listen and chest retain original navigation/claim handlers.
4. **Passed:** 14px trail, saturated completion fill, glowing finish head and flowing dots; reduced-motion dots absent. Light theme uses a visible semantic track rather than white-on-white.
5. **Passed:** existing 104px decorative PNG mascot alongside level, nearest lesson/story/chest/badge persona; glow and six visibility-gated decorations. Loops pause offscreen and when tab hidden.
6. **Passed live lesson:** finished Redefining Pleasure: Beyond Performance, saved 10 XP, returned to gold Lesson 1 and current Lesson 2; completion pop, temporary 12-particle burst, trail fill/head and bubble arc are wired to existing transient completion state. Separate sounds observed through oscillator instrumentation. Full fresh badge-level/chest reward ceremony was not repeated; existing reward rules remain unchanged.
7. **Passed:** real server-graded earned-badge quiz produced miss (220Hz), correct (660/880Hz), 3-combo (+1047Hz) and 5-combo (+1047/1320Hz). 10-combo exercised in isolated sound check with five notes. Settings OFF produced zero oscillators on real node/card/lesson start/advance. All new sounds share the same enabled gate. Immediate repeated trail sweep created one oscillator, not two. Instrumentation confirms synthesis, not subjective speaker loudness or device silent mode. Existing haptic helper used; physical device vibration unverified.
8. **Passed:** reduced-motion browser showed zero looping CSS animations and zero flow dots; static ring/raised faces remain. Particles and mascot/node loops disabled. Check/fill/entrance changes use static/fade alternatives.
9. **Passed locally:** no console/page errors; mobile had no horizontal overflow; 90-frame desktop scroll sample mean 16.65ms, max 18.9ms. Actual mid-range Android hardware/production 60fps is unverified.

## Validation
- 55 Bun tests passed, including new concrete combo/gesture-gating/sound-shape tests and existing quiz, XP, badge and path regressions.
- Harness build checked after final edits.
- Phone: 375 × 1000; desktop: 1280 × 1800. Light and dark screenshots visually reviewed; dark mode is the intended presentation. Screenshots delivered in Files.
- Comparable isolated minified learning-entry bundles (Bun; React/motion/backend SDK/image files external): before 387,601 bytes / 135,148 gzip; after approximately 401,700 bytes / 140,400 gzip, **+14.1 KB raw / +5.3 KB gzip**. This is not the complete Vite production bundle delta; harness exposes validation rather than production artifacts.

## Files changed
New: PathNode.tsx, pathIcons.tsx, PathScenery.tsx, usePathAnimation.ts, learning_sounds.test.ts, this report.
Updated: TierRoadmap.tsx, PathChest.tsx, LessonPlayer.tsx, ExerciseSession.tsx, SectionContent.tsx, QuizFeedbackSheet.tsx (avoid duplicate correct haptic), FinishSequence.tsx, Mascot.tsx (explicit path size), useSoundEffects.ts, soundGenerator.ts, index.css, AGENTS.md, roadmap.md.

Not published. No backend function changed.
