
# Launch Readiness Audit — Progress Tracker

## ✅ COMPLETED — Phase 1: Security & Core Fixes
- [x] RLS policies hardened (profiles, roles, badges, XP, quiz answers)
- [x] Server-side `validate_quiz_answer()` and `award_xp()` RPCs
- [x] Global AuthProvider, password reset, error boundary, OG tags
- [x] Quiz questions SELECT restricted to admins (users use public view)
- [x] `granted_by` constraint on user_roles INSERT
- [x] `search_path` set on all database functions
- [x] Leaked password protection enabled

## ✅ COMPLETED — Phase 2: Legal & Compliance
- [x] Privacy Policy & Terms of Service pages
- [x] Account deletion & data export via `manage-account` edge function
- [x] Expanded Settings page
- [x] ToS/Privacy consent checkbox at signup
- [x] Cookie consent banner (GDPR)
- [x] Age attestation integrated into signup consent

## ✅ COMPLETED — Phase 3: Safety
- [x] `reports` table with RLS (users create, admins view/update)
- [x] `blocked_users` table with RLS (users manage own blocks)
- [x] Chat report/block buttons now persist to database
- [x] Report reason selector with 7 categories
- [x] Blocked users filtered from discovery (Index.tsx)
- [x] Blocked users filtered from messages (Messages.tsx)
- [x] Account deletion cleans up reports & blocked_users

---

## 🔲 REMAINING — Still Needed Before Launch

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
