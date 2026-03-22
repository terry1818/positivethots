

## Capacitor Configuration Update

The project already has Capacitor partially set up. This plan updates the configuration to match requirements and adds missing plugins/scripts.

### Changes

**1. `capacitor.config.ts`** — Rewrite with:
- `appId: 'app.positivethots'`
- `appName: 'Positive Thots'`
- Production server URL: `https://positivethots.app`
- StatusBar plugin config: `backgroundColor: '#6633CC'` (HSL 270 60% 50% → hex), `style: 'DARK'`
- SplashScreen plugin config: `launchShowDuration: 2000`, `backgroundColor: '#6633CC'`
- PushNotifications config (existing)

**2. `package.json`** — Add:
- Dependencies: `@capacitor/status-bar`, `@capacitor/splash-screen`
- Move `@capacitor/cli` to devDependencies
- Scripts: `cap:sync`, `cap:android`, `cap:ios`

**3. `src/lib/capacitor.ts`** (new) — Platform-aware utility:
- Detect native platform via `Capacitor.isNativePlatform()`
- `initCapacitor()` function that configures StatusBar (color, style) and SplashScreen (hide after load) on native
- Camera helper: use `@capacitor/camera` on native, fall back to browser `getUserMedia` on web
- Push notification registration helper using `@capacitor/push-notifications`

**4. `src/main.tsx`** — Call `initCapacitor()` after app mount

**5. `src/components/PhotoUploadGrid.tsx`** — Use the camera helper from `capacitor.ts` so photo upload works natively on mobile (Capacitor Camera plugin) and falls back to file input on web

**6. `src/components/VerificationCard.tsx`** — Same camera helper integration for selfie capture

**7. No `capacitor.build.json`** — Capacitor 5+ doesn't use this file; build config lives in `capacitor.config.ts` and native project settings.

### File Summary

| File | Action |
|------|--------|
| `capacitor.config.ts` | Rewrite |
| `package.json` | Edit (deps + scripts) |
| `src/lib/capacitor.ts` | Create |
| `src/main.tsx` | Edit (add init call) |
| `src/components/PhotoUploadGrid.tsx` | Edit (native camera) |
| `src/components/VerificationCard.tsx` | Edit (native camera) |

