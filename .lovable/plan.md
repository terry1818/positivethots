

## Plan: Update Capacitor Config + Secure .gitignore

### Changes

**1. `capacitor.config.ts`** — Update 4 values:
- `appId`: `'app.lovable.e9a42b4b28b1420896a22ed7d317b095'` → `'app.positivethots.main'`
- `appName`: `'positivethots'` → `'Positive Thots'`
- `server.url`: Lovable project URL → `'https://positivethots.app'`
- `server.cleartext`: `true` → `false`
- `android.allowMixedContent`: `true` → `false`

**2. `.gitignore`** — Append environment variable entries (currently missing):
```
# Environment variables
.env
.env.*
.env.local
```

Note: `*.local` already exists on line 13, which covers `.env.local`, but the explicit `.env` and `.env.*` patterns are missing and critical.

### Not Changed
No other files modified. No logic, component, or database changes.

