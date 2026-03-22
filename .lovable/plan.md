
# Launch Readiness Audit — Progress Tracker

## ✅ COMPLETED — Phase 1: Security & Core Fixes
- [x] RLS policies hardened (profiles, roles, badges, XP, quiz answers)
- [x] Server-side `validate_quiz_answer()` and `award_xp()` RPCs
- [x] Global AuthProvider, password reset, error boundary, OG tags
- [x] Quiz questions SELECT restricted to admins (users use public view)
- [x] `granted_by` constraint on user_roles INSERT
- [x] `search_path` set on all database functions
- [x] Leaked password protection enabled
- [x] Profiles SELECT restricted to own-profile; discovery via secure RPCs
- [x] Role grant/revoke via SECURITY DEFINER RPCs (no direct table access)

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

## ✅ COMPLETED — Phase 4: UX Polish
- [x] Code splitting with React.lazy for all 15 route pages
- [x] Branded PageLoader with logo animation for Suspense fallback
- [x] Consistent PageSkeleton components (profile, chat, learn, list variants)
- [x] All 5 pages with spinner-only loading upgraded to contextual skeletons
- [x] Accessibility: aria-labels on all icon-only buttons across 8 pages
- [x] Accessibility: navigation landmark on BottomNav
- [x] Accessibility: skip-to-content link for keyboard users
- [x] Accessibility: semantic color tokens replacing hardcoded colors

---

## ✅ COMPLETED — Phase 5: Stripe Webhook & Subscription Management
- [x] `stripe-webhook` edge function handles subscription lifecycle events
- [x] `customer-portal` edge function for self-service subscription management
- [x] Subscription card in Settings page (status, manage, upgrade)
- [x] `STRIPE_WEBHOOK_SECRET` secret configured
- [x] Subscriptions table unique constraint on user_id for upsert

---

## 🔲 REMAINING — Still Needed Before Launch

### Phase 6: Operational
- [ ] Error monitoring integration
- [ ] Analytics integration
- [ ] Custom email templates
- [ ] Chat content moderation
