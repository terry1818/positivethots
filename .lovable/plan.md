

## Plan: 5 Prompts — Analytics, Discovery Preview, Empty Upsell, Push Notifications, Compatibility Reasons

---

### 2A: Onboarding Step Analytics

**Files:** `src/pages/Onboarding.tsx`

- Import `trackEvent` from `@/lib/analytics`
- Add `useEffect` on `step` changes: `trackEvent('onboarding_step_viewed', { step, phase: currentPhase?.label })`
- In `goNext()` before calling `advanceStep()` or showing interstitial: `trackEvent('onboarding_step_completed', { step, phase: currentPhase?.label })`
- In the phase transition branch of `goNext()`: `trackEvent('onboarding_phase_completed', { phase: currentPhase?.label })`
- On the skip button's `onClick`: `trackEvent('onboarding_skipped', { step })`
- In `handleComplete()` before `navigate("/learn")`: `trackEvent('onboarding_completed', {})`

No UI changes.

---

### 2B: Discovery Gate — Blurred Preview Instead of Redirect

**Files:** `src/pages/Index.tsx`

- Add state `previewMode: boolean` (default false) and `previewProfiles: EnhancedProfile[]`
- In `checkAuthAndSetup`, when `badgeCount < requiredFoundationCount`: instead of navigating to `/learn`, set `previewMode = true`, load up to 6 profiles via `get_discovery_profiles`, enhance them, store in `previewProfiles`, and `trackEvent('discovery_preview_shown', { badge_count: badgeCount })`
- In the render, when `previewMode` is true: show the existing header/bottom nav, render 6 profile cards with `filter: blur(8px)` and `pointer-events: none`, and overlay a centered card:
  - Title: "Unlock Discovery"
  - Body: "Complete N Foundation modules to see who's here"
  - Progress bar: `badgeCount / requiredFoundationCount`
  - Button: "Start Learning →" → `trackEvent('discovery_preview_cta_clicked')` then `navigate('/learn')`
- Remove the existing toast + redirect

---

### 2C: Empty Discovery Upsell & Referral

**Files:** `src/pages/Index.tsx`

- Replace the empty state card (lines 346-357) with two cards:
  1. **Boost card**: Zap icon, "Get Seen by More People", $2.99, button calls `supabase.functions.invoke("create-boost-payment")` (reuse existing header logic)
  2. **Referral card**: Users icon, "Invite a Friend, Earn a Free Boost", button copies referral link to clipboard. Generate referral link same as Settings: fetch user's referral code from `promo_codes` or create one, then copy `https://positivethots.lovable.app/auth?ref=CODE`
  3. Small note: "New profiles added daily — check back tomorrow"
- Track events: `discovery_empty_shown`, `discovery_empty_boost_clicked`, `discovery_empty_referral_clicked`

---

### 2D: Behavioral Push Notifications

**Files to create/modify:**

| File | Change |
|------|--------|
| `supabase/functions/notify-match/index.ts` | New — triggered by DB webhook or called after `check_match`. Sends push to both users on mutual match |
| `supabase/functions/notify-streak-risk/index.ts` | New — daily cron. Queries users with `last_activity_date = yesterday` and `current_streak > 0`, sends push |
| `supabase/functions/notify-winback/index.ts` | New — daily cron. Queries users with last login 7 days ago, sends push |
| `src/pages/Index.tsx` | After `check_match` returns a match ID, call `notify-match` via service role (or embed in the `check_match` RPC) |
| `src/pages/Chat.tsx` | On new message realtime event, if sender is not current user, call `send-push-notification` for recipient |
| 1 migration | Set up `pg_cron` jobs for streak-risk (daily 1AM UTC ≈ 8PM ET) and winback (daily 2AM UTC) |

**Implementation approach:**
- Match notification: After `check_match` returns a match ID in `handleConnect`/`handleSuperLike`, invoke `send-push-notification` with both user IDs. Use service-role key from an edge function wrapper.
- Better approach: Create a DB trigger on `matches` INSERT that calls the push function via `pg_net`. This handles all match sources.
- Message notification: Add a new edge function `notify-new-message` called from realtime or from a DB trigger on `messages` INSERT.
- Streak/winback: Edge functions invoked by `pg_cron` via `pg_net.http_post`.

**Simpler alternative for match + message:** Use Postgres triggers + `pg_net` to call `send-push-notification` on insert into `matches` and `messages` tables. This avoids client-side logic.

---

### 2E: Compatibility Reasons in Discovery Cards

**Files:** `src/pages/Index.tsx`, `src/components/discovery/DiscoveryCard.tsx`

- Create `calculateCompatibilityReasons(user, other, otherBadges, userBadges, isSharing)` returning `string[]` (up to 3 reasons):
  - Shared interests: "You share N interests including X and Y"
  - Matching relationship style: "You're both into [style]"
  - Similar experience level: "Similar relationship experience level"
  - Same location (if sharing): "Both near [city]"
  - Badge proximity: "Both completed similar education modules"
- Add `compatibility_reasons?: string[]` to `EnhancedProfile`
- In `loadSuggestions`, call the function and attach reasons to each profile
- In `DiscoveryCard.tsx`: add `compatibility_reasons?: string[]` to props interface. Below the score badge, if `compatibility_score >= 50` and reasons exist, render up to 2 reasons as `text-xs bg-muted/80 text-muted-foreground rounded-full px-2 py-0.5` pills

---

### Summary of All Files

| # | File | Prompt |
|---|------|--------|
| 1 | `src/pages/Onboarding.tsx` | 2A |
| 2 | `src/pages/Index.tsx` | 2B, 2C, 2D, 2E |
| 3 | `src/components/discovery/DiscoveryCard.tsx` | 2E |
| 4 | `supabase/functions/notify-match/index.ts` | 2D (new) |
| 5 | `supabase/functions/notify-streak-risk/index.ts` | 2D (new) |
| 6 | `supabase/functions/notify-winback/index.ts` | 2D (new) |
| 7 | 1 migration (pg_cron + DB triggers) | 2D |
| 8 | `src/pages/Chat.tsx` | 2D (message push) |

