

## Launch Readiness Assessment

Your app has strong foundations — auth, education, discovery, payments, moderation, legal pages, and Capacitor mobile support are all in place. Here's what remains, organized by priority.

---

### Critical Security Fixes (Must-fix before launch)

Based on a security scan, there are **6 findings**, including 1 **critical** issue:

1. **Privilege escalation via `user_roles` table** — No INSERT policy exists, so any authenticated user could grant themselves admin. Fix: add a restrictive INSERT policy (service_role only).
2. **`super_like_balance` UPDATE is unrestricted** — Users can set their balance to any number. Fix: remove direct UPDATE policy; handle balance changes via a security-definer function.
3. **`matches` INSERT is too permissive** — Any user can create a match with anyone. Fix: restrict match creation to a server-side function.
4. **Quiz `correct_answer` exposed** — The SELECT policy on `quiz_questions` exposes answers. Fix: restrict direct table access; use the existing `quiz_questions_public` view.
5. **Leaked password protection disabled** — Enable it in auth settings.
6. **Profile SELECT policy too restrictive for discovery** — Verify that discovery uses the `get_public_profile` RPC securely and not a bypass.

---

### Production Hardening

| Area | What's Missing | Effort |
|------|---------------|--------|
| **Rate limiting** | No rate limiting on edge functions (sign-up abuse, payment spam) | Medium |
| **Email verification** | Confirm auto-confirm is disabled so users must verify email | Low |
| **Edge function JWT** | Several functions have `verify_jwt = false` — audit which ones truly need it open | Low |
| **Error monitoring** | Error reporting is basic (DB insert only) — consider adding external alerting | Low |

---

### App Store Readiness (for Capacitor/native)

| Item | Status | What to do |
|------|--------|------------|
| **App icons** | Missing | Generate icon sets (1024×1024 source) for iOS/Android |
| **Splash screen assets** | Missing | Create branded splash images for all device sizes |
| **Deep linking** | Not configured | Set up universal links (iOS) / app links (Android) for `/auth`, `/chat`, etc. |
| **Push notification backend** | Partially done | Store device tokens in DB; create a function to send notifications on match/message |
| **App Store metadata** | Not started | Screenshots, description, privacy policy URL, age rating |

---

### Nice-to-Have Before Launch

- **Offline support / PWA** — No service worker exists; add `vite-plugin-pwa` for installable web app fallback
- **Loading/empty states** — Audit all pages for proper skeleton/empty states
- **Accessibility audit** — Ensure keyboard navigation, ARIA labels, color contrast
- **Analytics dashboard** — Admin panel exists but verify it surfaces actionable metrics
- **Onboarding completion tracking** — Ensure users who abandon onboarding can resume

---

### Recommended Execution Order

| Step | Priority | Items |
|------|----------|-------|
| 1 | 🔴 Critical | Fix all 6 security findings (RLS policies, leaked password protection) |
| 2 | 🟠 High | Rate limiting on auth + payment edge functions |
| 3 | 🟠 High | App icons + splash screen assets for native builds |
| 4 | 🟡 Medium | Push notification token storage + send-on-match function |
| 5 | 🟡 Medium | Deep linking configuration |
| 6 | 🟢 Low | PWA/offline support, accessibility polish |

Want me to start with the critical security fixes?

