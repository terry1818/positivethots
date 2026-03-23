

# Combined Plan: Admin Management, Mascot Refinement, and E2E Testing

## 1. Owner-Only Admin Role Management UI

**Database migration:**
- Create `get_user_id_by_email(email text)` — security definer function that queries `auth.users`, restricted to admins via `is_admin(auth.uid())`
- Update `grant_role` — add owner-only check: if `_role = 'admin'`, only the owner's UUID can execute. Other admins can grant `moderator`/`user` only
- Update `revoke_role` — same owner-only restriction for the `admin` role
- Owner UUID will be looked up from `user_roles` (the first admin record)

**File: `src/pages/Settings.tsx`**
- Add "Admin Tools" card visible only to admins (via existing `useAdminRole` hook)
- Email input + role selector (admin option only shown if current user is the owner) + "Grant Role" button
- List of current role holders with "Remove" buttons
- Calls `supabase.rpc("grant_role", ...)` and `supabase.rpc("revoke_role", ...)`

## 2. Mascot Celebration Image Refinement

**File: `src/assets/mascot-celebration.png`**
- Regenerate using AI image generation with prompt referencing the logo's art style — sensual, confident woman in a celebratory pose, warm purple/magenta palette, matching the adult/intimate dating app aesthetic (not cartoonish)
- No code changes needed — asset replacement only

## 3. End-to-End Feature Test Plan

Comprehensive checklist to execute after implementation:

### Authentication & Onboarding
1. Sign up — verify email confirmation required, profile created on first login
2. Sign in — valid credentials redirect correctly
3. Forgot password — reset flow works end-to-end
4. Onboarding — all 12 steps save data, completion unlocks Learn
5. Age/terms gate — 18+ and terms enforced

### Education / Learn
6. Learn page — modules load, tiers collapse/expand, progress bars correct
7. Module content — sections load, all 7 replaced videos play, text renders
8. Section progress — saves correctly, "Continue Learning" updates
9. Quiz flow — "Take Quiz" appears after sections, badge awarded at 80%+
10. XP & Streaks — awards, level-up celebration, streak calendar
11. Daily challenge — appears, tracks, rewards XP
12. Tier completion — celebration modal with mascot, confetti, sound, share buttons
13. Feature unlocking — Discovery unlocks after Foundation, progress bar correct

### Discovery & Matching
14. Discovery cards — profiles load, swiping works
15. Match creation — mutual right-swipe creates match
16. Super likes — daily refresh, decrement, purchase flow

### Messaging
17. Messages list — matches appear, unread indicators
18. Chat — send/receive, moderation triggers
19. Real-time — messages appear without refresh

### Profile
20. View/edit profile — fields display and update correctly
21. BDSM test — Edit Profile → Kink Profile card works
22. Profile boost — VIP-only via RPC, no bypass
23. Verification — selfie submission creates request

### Premium & Payments
24. Premium page — checkout with valid price IDs only
25. Subscription status — tier badge and feature unlocks
26. Customer portal — Stripe billing portal opens
27. Super like purchase — payment and balance update

### Social & Settings
28. Likes You — premium sees likers, free sees count
29. Events, Resources, Location sharing — all functional
30. Theme toggle, password change, promo codes, data export, account deletion
31. Admin panel — analytics, errors, moderation, content editing

### Security
32. Boost bypass — `/profile?boost=activated` blocked
33. Price ID validation — invalid IDs rejected
34. Quiz answer enumeration — answers hidden until submission
35. RLS policies — users can't access others' private data
36. Admin role management — only owner can grant/revoke admin

## Files to modify
- `src/pages/Settings.tsx` — add Admin Tools card
- `src/assets/mascot-celebration.png` — regenerate refined asset
- Database migration — `get_user_id_by_email` RPC, update `grant_role` and `revoke_role` with owner-only admin checks

