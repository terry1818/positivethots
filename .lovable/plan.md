
# Launch Readiness Audit — Progress Tracker

## ✅ COMPLETED — Phase 1: Security & Core Fixes

### Security (Done)
- [x] Profiles SELECT restricted to `authenticated` only
- [x] User roles SELECT scoped to own roles only  
- [x] Duplicate "view all badges" policy removed (own-only remains)
- [x] Quiz `correct_answer` hidden from clients via `quiz_questions_public` view
- [x] Server-side `validate_quiz_answer()` RPC created
- [x] Server-side `award_xp()` RPC created (capped at 200 XP/tx)
- [x] Client-side XP INSERT and stats UPDATE policies removed
- [x] `useLearningStats` updated to use `award_xp` RPC
- [x] `LearnModule` quiz validation moved server-side
- [x] Security definer view fixed (security_invoker = true)
- [x] `update_updated_at` function search_path set

### Auth & UX (Done)
- [x] Global `AuthProvider` with `onAuthStateChange` listener
- [x] Password reset flow: "Forgot password?" link + `/reset-password` page
- [x] React `ErrorBoundary` wrapping entire app
- [x] OG meta tags fixed: "Positive Thots" branding, proper descriptions

---

## ✅ COMPLETED — Phase 2: Legal & Compliance

- [x] Privacy Policy page (`/privacy`) — covers GDPR, CCPA, sensitive data handling, age requirements
- [x] Terms of Service page (`/terms`) — covers eligibility, conduct, content guidelines, liability
- [x] Account deletion flow with "DELETE" confirmation dialog
- [x] Data export (JSON download via `manage-account` edge function)
- [x] Expanded Settings page: password change, data export, legal links, danger zone
- [x] `manage-account` edge function deployed (export + delete actions)

---

## 🔲 REMAINING — Still Needed Before Launch

### Phase 3: Safety
- [ ] Create `reports` and `blocked_users` tables
- [ ] Persist report/block actions in Chat
- [ ] Filter blocked users from discovery/messages
- [ ] Admin moderation dashboard

### Phase 4: UX Polish
- [ ] Code splitting with React.lazy
- [ ] Consistent loading states across all pages
- [ ] Accessibility audit

### Phase 5: Operational
- [ ] Stripe webhook handler
- [ ] Error monitoring integration
- [ ] Analytics integration
- [ ] Custom email templates
- [ ] Chat content moderation
