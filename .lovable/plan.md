

# Launch Readiness Audit — What's Missing Before June 2026

## Current State
The app has solid foundations: auth, onboarding, education/gamification, matching/swiping, chat, premium subscriptions, photo moderation, and admin tools. But there are significant gaps across security, legal, UX, and operational readiness.

---

## CRITICAL — Must Fix Before Launch

### 1. Security Vulnerabilities (8 findings from security scan)

**ERROR-level (data exposure):**
- **Profiles table publicly readable without auth** — sensitive fields like `sti_status`, `sexuality`, `desires`, `boundaries` are exposed to unauthenticated users. Fix: restrict SELECT to `authenticated` role, or further to matched-users-only for sensitive fields.
- **Quiz correct answers exposed** — any authenticated user can read `correct_answer` from `quiz_questions`, trivially cheating all quizzes. Fix: remove `correct_answer` from client reads; validate answers server-side via an edge function.

**WARN-level (exploitable):**
- **Users can self-award XP** — `xp_transactions` INSERT and `user_learning_stats` UPDATE are client-writable. Users can set arbitrary XP/level/streak. Fix: move all XP logic to a security definer function.
- **User roles readable by all** — any authenticated user can see who is admin. Fix: restrict to own-role-only SELECT.
- **All user badges publicly readable** — quiz scores and attempt counts of all users exposed. Fix: scope to own badges only.
- **Leaked password protection disabled** — enable in auth settings.
- **Function search paths mutable** — set `search_path` on all database functions.

### 2. Legal & Compliance (NOTHING exists currently)
For a dating/sexual health app, this is non-negotiable:
- **Privacy Policy** — required by app stores, GDPR, CCPA. Must detail data collection, sexual health data handling, third-party sharing.
- **Terms of Service** — age verification (18+), user conduct, content policies, liability limitations.
- **Cookie/Consent Banner** — GDPR requires explicit consent for analytics/tracking.
- **Data Deletion** — GDPR "right to erasure." No account deletion exists. Must add a "Delete Account" flow in Settings that purges all user data.
- **Data Export** — GDPR "right to portability." Users must be able to download their data.
- **Age Verification Strengthening** — currently just a number input. Consider requiring date of birth or checkbox attestation with legal language.

### 3. Password Reset Flow (MISSING)
No forgot password functionality exists anywhere. Users who forget their password are permanently locked out. Must add:
- "Forgot Password?" link on Auth page
- Password reset email via `supabase.auth.resetPasswordForEmail()`
- `/reset-password` page to set new password

### 4. Auth State Management (FRAGILE)
No `onAuthStateChange` listener anywhere. Every page individually calls `getSession()`. This means:
- Token refresh failures silently break the app
- Sign-out in one tab doesn't propagate
- Session expiry isn't handled gracefully
Fix: Add a global auth context with `onAuthStateChange` listener.

---

## HIGH PRIORITY — Should Fix Before Launch

### 5. Report & Block Are Fake
`handleReport` and `handleBlock` in Chat.tsx just show toasts — they don't persist anything. For a dating app, this is a safety requirement:
- Create `reports` and `blocked_users` tables
- Filter blocked users from discovery/messages
- Admin dashboard to review reports

### 6. Settings Page Is Nearly Empty
Only has theme toggle. Needs:
- Account deletion
- Password change
- Notification preferences
- Privacy controls (profile visibility, incognito)
- Blocked users list
- Help/Support link
- App version info

### 7. SEO & Branding
- `index.html` has a placeholder OG image from Lovable
- OG title is a UUID: `e9a42b4b-28b1-4208-96a2-2ed7d317b095`
- Title says "SwipeMatch" but app is "Positive Thots"
- No favicon
- Need proper OG images, title, description for social sharing

### 8. Error Boundaries
No React error boundaries. A crash in one component takes down the entire app. Add:
- Global error boundary with "Something went wrong" fallback
- Per-route error boundaries for graceful degradation

### 9. Loading & Empty States Consistency
Some pages have proper loading skeletons, others don't. Audit and standardize across all data-fetching pages.

---

## MEDIUM PRIORITY — Polish Before Launch

### 10. Accessibility (WCAG)
- Audit all interactive elements for keyboard navigation
- Add `aria-label` to icon-only buttons
- Ensure color contrast ratios meet AA standards
- Screen reader testing for education content
- Focus management on modals/dialogs

### 11. Offline/Network Error Handling
No offline detection or network error recovery. Add:
- Network status indicator
- Retry mechanisms for failed API calls
- Graceful degradation when offline

### 12. Performance
- No code splitting — entire app loads at once. Add `React.lazy` for route-level splitting.
- No image optimization — profile images loaded at full resolution
- Consider adding a service worker for caching

### 13. Email Templates
Default auth emails are generic. Customize:
- Welcome/verification email
- Password reset email
- Match notification email (future)

### 14. Analytics & Monitoring
No analytics integration. Before launch, add:
- User event tracking (signups, matches, module completions)
- Error monitoring (Sentry or similar)
- Performance monitoring

### 15. Stripe Webhook
`create-checkout` and `check-subscription` exist, but there's no Stripe webhook handler. If a subscription is cancelled/renewed outside the app, the status won't update until the next polling check. Add a webhook endpoint to handle `customer.subscription.updated/deleted` events.

### 16. Content Moderation Pipeline
`moderate-photo` exists but:
- No admin review queue for flagged content
- No moderation for chat messages (harassment, explicit content)
- No automated profanity filter for bios/names

---

## PRE-LAUNCH CHECKLIST

### Technical
- [ ] Fix all 8 security findings
- [ ] Add password reset flow
- [ ] Add global auth context with `onAuthStateChange`
- [ ] Make report/block functional with database tables
- [ ] Add React error boundaries
- [ ] Fix OG meta tags and branding
- [ ] Add Stripe webhook handler
- [ ] Code splitting for routes
- [ ] Add rate limiting on edge functions

### Legal
- [ ] Privacy Policy page
- [ ] Terms of Service page
- [ ] Cookie consent banner
- [ ] Account deletion flow
- [ ] Data export functionality
- [ ] Age verification strengthening

### Operational
- [ ] Error monitoring setup
- [ ] Analytics integration
- [ ] Custom email templates
- [ ] Admin moderation dashboard
- [ ] Chat content moderation
- [ ] Backup & disaster recovery plan
- [ ] Load testing

### UX
- [ ] Expand Settings page
- [ ] Accessibility audit
- [ ] Offline/error handling
- [ ] Consistent loading states
- [ ] Mobile responsive QA across devices

---

## Recommended Implementation Order

1. **Security fixes** (1-2 sessions) — the errors are exploitable today
2. **Legal pages + account deletion** (1 session) — app store requirement
3. **Password reset + auth context** (1 session) — basic auth completeness
4. **Report/block persistence** (1 session) — safety requirement
5. **OG tags + branding** (quick fix)
6. **Settings expansion** (1 session)
7. **Error boundaries + code splitting** (1 session)
8. **Stripe webhook** (1 session)
9. **Analytics + monitoring** (1 session)
10. **Accessibility + polish** (ongoing)

This is achievable well before June 2026 with focused sessions.

