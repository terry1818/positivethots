

## Remaining Launch Readiness Items

After reviewing the codebase and security scan, here's what I can still automate for you.

### What's Already Done
- Security: RLS hardened, RPC-only matches/super-likes, quiz answers hidden, rate limiting on payment functions
- Capacitor: Configured with StatusBar, SplashScreen, push notifications, device token storage
- PWA: Service worker, manifest, offline caching
- Deep linking: Capacitor config ready

### What I Can Still Do

**1. Onboarding Resume Support**
Users who abandon onboarding mid-flow currently restart from step 1. Save progress to the `profiles` table on each step so returning users resume where they left off.

**2. Empty States for All Pages**
Messages, LikesYou, Learn, and Shop pages lack dedicated empty-state illustrations/messages when there's no data. Add friendly empty states with CTAs (e.g., "No matches yet — start swiping!").

**3. Auth Guard Consolidation**
Multiple pages duplicate `checkAuth` logic with raw `supabase.auth.getSession()`. Create a shared `useRequireAuth()` hook that redirects to `/auth` and checks `onboarding_completed`, reducing duplicated code and preventing edge cases.

**4. Realtime Message Notifications**
The Chat page likely polls or subscribes but the Messages list page doesn't show unread counts. Add a realtime subscription for new messages and display unread badges on the Messages tab in BottomNav.

**5. Meta Tags & SEO**
Add `<meta>` description, Open Graph tags, and Twitter Card tags to `index.html` for link sharing previews (important for App Store review and social sharing).

**6. Security Scan Refresh**
The security scan results are stale. I can trigger a fresh scan to verify all fixes are applied correctly.

### What Requires Manual Action (Not Automatable by Me)
- **Leaked password protection**: Must be toggled in backend auth settings (I can configure this via the auth tool)
- **App Store screenshots & metadata**: Requires design assets from you
- **Domain verification files** (`apple-app-site-association`, `assetlinks.json`): Need your production domain DNS access
- **FCM/APNs credentials**: Need keys from Firebase Console / Apple Developer Portal

---

### Recommended Order

| Step | Task | Files |
|------|------|-------|
| 1 | Auth guard hook + onboarding resume | New hook + edit Onboarding.tsx, Index.tsx |
| 2 | Empty states for all list pages | Messages, LikesYou, Learn, Shop |
| 3 | Unread message badges (realtime) | BottomNav, Messages |
| 4 | Meta/OG tags | index.html |
| 5 | Enable leaked password protection | Auth config tool |

Shall I implement all of these?

