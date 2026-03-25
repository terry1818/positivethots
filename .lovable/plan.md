

## Plan: Security Hardening & Data Integrity Fixes

This plan covers three prompts (1A, 1B, 1C) with a total of 7 fixes across ~25 files.

---

### Prompt 1A — Fix Fake Data & Harden CORS

#### FIX 1: Remove fake last_active and distance (Index.tsx + DiscoveryCard.tsx)

**Files:** `src/pages/Index.tsx`, `src/components/discovery/DiscoveryCard.tsx`

- Remove `LAST_ACTIVE_OPTIONS` array (line 57)
- Remove the random `last_active` and `distance` assignments (lines 187, 189)
- For `distance`: use the existing `useLocationSharing` hook's `currentPosition` and `nearbyUsers` data. If `isSharing` is false or no position data exists, set `distance` to `null`
- For `last_active`: omit entirely (no real `last_seen_at` column exists on profiles)
- Update `DiscoveryCard.tsx` (lines 99-104): conditionally render the distance badge only when `profile.distance` is not null, and the last_active badge only when `profile.last_active` exists

#### FIX 2: Remove fake online status (Chat.tsx)

**File:** `src/pages/Chat.tsx`

- Remove line 89 (`setOnlineStatus(Math.random() > 0.5 ...)`) — the real presence channel at line 108-111 handles this
- Remove line 90 (`setLastSeen(new Date(...))`) — last seen will remain null until presence provides it
- Line 98: change `Math.random() > 0.3` to `false` — messages are unread by default until confirmed

#### FIX 3: Remove fake learner count (Learn.tsx)

**File:** `src/pages/Learn.tsx`

- Add state `activeLearnerCount: number | null` (default null)
- In `loadData`, query: `supabase.from('analytics_events').select('user_id', { count: 'exact', head: true }).eq('event_name', 'module_section_viewed').gte('created_at', new Date(Date.now() - 86400000).toISOString())`
- Note: this counts rows not distinct users, but it's a reasonable approximation and avoids needing a new RPC. If zero or error, set to null
- Replace line 192: render the social proof row only when `activeLearnerCount` is not null and > 0

#### FIX 4: CORS origin restriction

**Important caveat:** The app uses Capacitor for native mobile. The Capacitor webview loads from `https://e9a42b4b-28b1-4208-96a2-2ed7d317b095.lovableproject.com`. Also, the Stripe webhook calls edge functions server-to-server (no browser origin). Locking to a single origin would break:
- The Lovable preview (`https://id-preview--e9a42b4b-...lovable.app`)
- The published app (`https://positivethots.lovable.app`)
- The Capacitor native app
- Stripe webhooks (stripe-webhook function)
- Internal service calls (process-email-queue, handle-email-suppression, auth-email-hook)

**Recommended approach:** Instead of hardcoding one origin, use a dynamic allowlist that checks the `Origin` header against approved domains:
- `positivethots.app`
- `positivethots.lovable.app`
- `*.lovable.app` (for preview)
- `*.lovableproject.com` (for Capacitor)

For server-to-server functions (stripe-webhook, process-email-queue, handle-email-suppression, auth-email-hook, send-push-notification), keep `*` since they don't serve browsers or already validate via signatures/JWT.

**Files affected (18 edge functions):** All files under `supabase/functions/*/index.ts` that have `"Access-Control-Allow-Origin": "*"`. I'll create a shared CORS utility in `supabase/functions/_shared/cors.ts` and import it.

---

### Prompt 1B — OWNER_ID & .gitignore

#### FIX 1: Remove hardcoded OWNER_ID

**Note on approach:** Creating a new edge function for this is unnecessary. The existing `user_roles` table already has an `'admin'` role, and the `grant_role`/`revoke_role` RPCs already hardcode the owner UUID server-side (which is fine — it's in a security-definer function, not exposed to clients). The client just needs to check if the user has a specific role.

**Better approach:** Add an `'owner'` role to the `app_role` enum and assign it to the owner in the database. Then in Settings.tsx, replace the hardcoded check with `has_role(auth.uid(), 'owner')` via the existing `useAdminRole` hook (or a new query).

**However**, the `app_role` enum currently only has `admin`, `moderator`, `user`. Adding `owner` requires a migration. Alternatively, we can just check if the user is admin AND check via an RPC. The simplest secure approach:

- **Migration:** Add `'owner'` to the `app_role` enum. Insert an `owner` role row for the owner UUID
- **Update `grant_role` and `revoke_role` RPCs:** Change the hardcoded UUID check to `has_role(auth.uid(), 'owner')`
- **Settings.tsx:** Remove `OWNER_ID` constant. Add a query in `useEffect` to check `has_role(user.id, 'owner')` via `supabase.rpc('has_role', { _user_id: user.id, _role: 'owner' })`. Set `isOwner` from the result

**Files:** `src/pages/Settings.tsx`, one migration file

#### FIX 2: .gitignore + .env.example

**Files:** `.gitignore`, new `.env.example`

- Add `.env`, `.env.local`, `.env.production`, `.env*.local` to `.gitignore`
- Create `.env.example` with placeholder values

**Note:** The `.env` file in this Lovable project is auto-generated and managed by the platform. Adding it to `.gitignore` won't affect the Lovable build (env vars are injected automatically). But it's good practice for anyone cloning the repo.

---

### Prompt 1C — Photo Moderation: Block Until Approved

#### PhotoUploadGrid.tsx changes

**File:** `src/components/PhotoUploadGrid.tsx`

- For photos with `moderation_status = "pending"` (lines 237-256): replace the visible `<img>` with a blurred overlay. Apply `blur-lg` CSS filter and overlay with "Under review" text
- For `"rejected"` photos: already shows the reason (line 252-256). Add a more prominent "Remove" button

#### Database migration: Update `get_discovery_profiles` RPC

Currently the RPC returns `profile_image` and `photos` directly from the profiles table. The `photos` column on profiles is a simple text array of URLs — it doesn't have per-photo moderation status. The moderation status lives in the `user_photos` table.

**Approach:** Update `get_discovery_profiles` to filter `profile_image`:
- If the profile's `profile_image` corresponds to a photo in `user_photos` with status != 'approved', return null for `profile_image`
- For the `photos` array: replace it with only approved photos from `user_photos` (or legacy photos not in `user_photos`)

**Migration:** Redefine `get_discovery_profiles` to join with `user_photos` and filter.

Also update `get_public_profile` the same way since it's used in Chat and profile views.

**Files:** `src/components/PhotoUploadGrid.tsx`, one migration file

---

### Summary of All Files Touched

| # | File | Changes |
|---|------|---------|
| 1 | `src/pages/Index.tsx` | Remove fake last_active/distance |
| 2 | `src/components/discovery/DiscoveryCard.tsx` | Conditional distance/last_active rendering |
| 3 | `src/pages/Chat.tsx` | Remove fake online status and random read |
| 4 | `src/pages/Learn.tsx` | Real learner count query |
| 5 | `supabase/functions/_shared/cors.ts` | New shared CORS utility with origin allowlist |
| 6-22 | 17 edge function `index.ts` files | Import shared CORS |
| 23 | `src/pages/Settings.tsx` | Remove OWNER_ID, use RPC |
| 24 | `.gitignore` | Add .env entries |
| 25 | `.env.example` | New file with placeholders |
| 26 | `src/components/PhotoUploadGrid.tsx` | Blur pending photos |
| 27 | Migration: `app_role` enum + owner role | Add 'owner' to enum |
| 28 | Migration: Update discovery/public RPCs | Filter unapproved photos |

