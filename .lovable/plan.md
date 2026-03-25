

## Plan: Chat Icebreakers, Admin Analytics, Streak Rewards, Leaderboard, Rate Limiting

Covers Prompts 4A, 4B, 4C across 6 files + 1 new edge function + 1 migration.

---

### 4A-1: Icebreaker Suggestions in Empty Chat

**File:** `src/pages/Chat.tsx`

- Below the existing safety notice card (line 299-312), when `messages.length === 0`, render 3 icebreaker pill buttons above the message input area.
- Generate icebreakers based on `currentUser` and `otherUser` shared data (both available in state):
  - Check shared `relationship_style` for ENM/polyamory overlap
  - Use generic fallbacks: "What brought you to Positive Thots?", "What's your favourite module so far?", "What does ethical non-monogamy mean to you personally?"
- On tap: `setNewMessage(text)` + `trackEvent('icebreaker_tapped', { suggestion_index })`. Do NOT auto-send.
- Hide icebreakers once `messages.length > 0`.
- Note: Badge data for both users is not loaded in Chat.tsx currently. Rather than adding extra queries, use profile fields (`relationship_style`, `interests`) for contextual suggestions and rely on generic fallbacks for the rest.

### 4A-2: Admin Analytics Metrics

**File:** `src/components/admin/AnalyticsTab.tsx`

- Add state for 7 metrics (A-G). Load them in `loadStats`:
  - A: `profiles` count (exact, head)
  - B: `profiles` count where `onboarding_completed = true`
  - C: B/A percentage
  - D: `user_badges` count (exact, head) — note: counts rows not distinct users, but approximation is fine since unique constraint exists on (user_id, module_id)
  - E: `swipes` count (exact, head)
  - F: `subscriptions` count where `status = 'active'`
  - G: F/A percentage
- Render as a 2-column grid of metric cards above the existing event list
- All queries run with admin role (AnalyticsTab is only visible to admins)

---

### 4B-1: Streak Milestone Rewards

**Files:** `supabase/functions/grant-streak-reward/index.ts` (new), `src/pages/LearnModule.tsx`

**New edge function `grant-streak-reward`:**
- Authenticates caller via JWT
- Accepts `{ streak: number }`
- Checks a `streak_rewards` tracking mechanism — to keep it simple without a new table, check `xp_transactions` for a source like `streak_reward_7` for idempotency
- Rewards:
  - Day 7: Insert +1 to `super_like_balance` (upsert balance + 1)
  - Day 30: Insert row into `profile_boosts`
  - Day 100: Insert +3 to `super_like_balance`
- Uses service role for writes to `profile_boosts` (user can't insert per RLS)

**Migration:** Add an RLS policy allowing service role to insert into `super_like_balance` (currently only user can insert, but the edge function uses service role so this is fine — service role bypasses RLS).

**`src/pages/LearnModule.tsx`:** After `setCelebration({ type: "streak_milestone", streak })` at line 143, invoke `grant-streak-reward` with the streak value.

**`src/components/education/CelebrationModal.tsx`:** Add reward text below the streak message for days 7, 30, 100.

### 4B-2: Top Learners Leaderboard

**File:** `src/pages/Learn.tsx`

- Replace "Why Education First?" card (lines 379-388) with a "Top Learners This Week" leaderboard.
- Query: `user_section_progress` where `completed = true` and `last_accessed >= 7 days ago`, count by `user_id`, limit 5. Note: RLS on `user_section_progress` only allows viewing own data, so this query will only return the current user's data.
- **Solution:** Create a new security-definer RPC `get_weekly_leaderboard` that returns top 5 users with anonymized names. This avoids RLS issues.
- **Migration:** Create `get_weekly_leaderboard()` RPC that joins `user_section_progress` with `profiles`, returns rank, first name + last initial, sections count. Only returns data if >= 3 users qualify.
- Display: ranked list with initials avatar, "Alex T." format name, sections completed count. Highlight current user's row. Hide entirely if fewer than 3 users.

---

### 4C: Rate Limiting on Messages

**File:** `supabase/functions/moderate-message/index.ts`

- After the match participant check (line 66), before AI moderation, query `messages` table: count where `sender_id = userId` and `match_id = match_id` and `created_at >= now() - 60 seconds`. If count >= 10, return 429.
- Uses the existing `adminClient` for the query.

**File:** `src/pages/Chat.tsx`

- Add `sendingRef` with a timestamp to enforce 500ms debounce between sends.
- In `handleSendMessage`: check if moderation returns 429 status or error. If so, show toast "Slow down — you're sending too quickly" and don't add message to state.
- Check the `supabase.functions.invoke` response for error status.

---

### Summary of Files

| # | File | Prompt |
|---|------|--------|
| 1 | `src/pages/Chat.tsx` | 4A (icebreakers), 4C (rate limit client) |
| 2 | `src/components/admin/AnalyticsTab.tsx` | 4A (metrics) |
| 3 | `supabase/functions/grant-streak-reward/index.ts` | 4B (new) |
| 4 | `src/pages/LearnModule.tsx` | 4B (invoke reward) |
| 5 | `src/components/education/CelebrationModal.tsx` | 4B (reward text) |
| 6 | `src/pages/Learn.tsx` | 4B (leaderboard) |
| 7 | `supabase/functions/moderate-message/index.ts` | 4C (server rate limit) |
| 8 | 1 migration (leaderboard RPC) | 4B |

