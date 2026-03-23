

# Replace vite-plugin-pwa with a Lightweight Custom Service Worker

## Why
`vite-plugin-pwa` v0.19.8 pulls in `workbox-build`, which transitively depends on vulnerable versions of `@rollup/plugin-terser` and `serialize-javascript`. The latest v1.2.0 still carries similar transitive risk. Replacing it with a hand-written service worker and manifest eliminates the entire dependency chain.

## What Changes

### 1. Remove dependencies from `package.json`
- Remove `vite-plugin-pwa`
- Remove `serialize-javascript` (was an override for this chain)

### 2. Update `vite.config.ts`
- Remove the `VitePWA` import and entire plugin configuration block
- Keep all other config (react, tagger, build chunks, etc.) unchanged

### 3. Create `public/manifest.json`
- Move the manifest data currently inline in the VitePWA config (app name, icons, theme color, display mode) into a standalone JSON file

### 4. Create `public/sw.js` — minimal service worker
- Cache-first for Google Fonts
- Network-first for Supabase API calls (same strategy as current config)
- Precache the app shell on install
- Skip `/~oauth` routes (required for auth redirects)
- Auto-update on new deployments via `skipWaiting` + `clients.claim`

### 5. Update `index.html`
- Add `<link rel="manifest" href="/manifest.json">`
- Add `<meta name="theme-color" content="#6633CC">`

### 6. Register the service worker in `src/main.tsx`
- Add a small registration snippet that registers `/sw.js` after the app mounts
- Handles update detection with a simple reload prompt

## Result
- All PWA features preserved (installable, offline shell, font caching, API caching)
- The vulnerable `workbox-build` → `@rollup/plugin-terser` dependency chain is completely removed
- No new runtime dependencies added

