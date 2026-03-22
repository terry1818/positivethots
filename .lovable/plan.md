

## Implementation Plan: Profile Boosts, Super Likes, and Capacitor Setup

This is a large multi-feature request covering three distinct areas. Here is the full plan.

---

### 1. Profile Boosts

**Database**: New `profile_boosts` table tracking active boosts per user.

```text
profile_boosts
├── id (uuid, PK)
├── user_id (uuid, FK)
├── activated_at (timestamptz, default now())
├── expires_at (timestamptz, default now() + 24h)
├── created_at (timestamptz)
```

RLS: Users can read/insert their own boosts. No update/delete.

**Stripe**: Create a one-time "Profile Boost" product ($2.99) via Stripe tools.

**Edge Function**: `create-boost-payment` — one-time Stripe checkout (`mode: "payment"`) that creates a boost row on success. Use the success URL with a query param to trigger boost activation.

**Discovery Feed Logic**: Modify `get_discovery_profiles` RPC (or the frontend sorting) to prioritize users with an active boost (where `expires_at > now()`). Boosted profiles appear first in the grid.

**UI**: Add a "Boost" button on the Profile page (for VIP subscribers it's free once/month, others pay). Show a "Boosted" badge on DiscoveryCard for boosted profiles.

**Files changed**:
- Migration: create `profile_boosts` table + RLS
- `supabase/functions/create-boost-payment/index.ts` (new)
- `src/pages/Profile.tsx` — add Boost button
- `src/pages/Index.tsx` — sort boosted profiles first
- `src/components/discovery/DiscoveryCard.tsx` — show Boosted badge

---

### 2. Super Likes

**Database**: Two new tables.

```text
super_likes
├── id (uuid, PK)
├── sender_id (uuid)
├── receiver_id (uuid)
├── created_at (timestamptz)

super_like_balance
├── user_id (uuid, PK)
├── balance (int, default 0)
├── last_daily_refresh (date)
├── updated_at (timestamptz)
```

RLS: Users can read/insert their own super likes. Balance readable/updatable by own user.

**Daily Allocation Logic**: A database function `refresh_daily_super_likes` checks `last_daily_refresh`; if it's before today, resets balance to 5 (or unlimited for VIP). Called when loading the discovery page.

**Stripe**: Create a "Super Like Pack (10)" product ($1.99 one-time) for purchasing extra super likes.

**Edge Function**: `create-superlike-payment/index.ts` — one-time payment, on success adds 10 to balance.

**Discovery Feed Integration**:
- Add a "Super Like" button (star icon) to DiscoveryCard alongside Connect/Pass
- Super Like decrements balance, inserts into `super_likes`, and inserts a `direction: 'super'` swipe
- Receiver sees a special highlight on the LikesYou page for super likes

**Files changed**:
- Migration: create `super_likes`, `super_like_balance` tables + RLS + `refresh_daily_super_likes` function
- `supabase/functions/create-superlike-payment/index.ts` (new)
- `src/hooks/useSuperLikes.ts` (new) — manages balance, daily refresh, sending
- `src/components/discovery/DiscoveryCard.tsx` — add Super Like button
- `src/pages/Index.tsx` — wire up super like handler
- `src/pages/LikesYou.tsx` — highlight super likes

---

### 3. Capacitor Setup

**Dependencies**: Install `@capacitor/core`, `@capacitor/cli` (dev), `@capacitor/ios`, `@capacitor/android`, `@capacitor/camera`, `@capacitor/push-notifications`.

**Configuration**: Create `capacitor.config.ts`:
```typescript
const config = {
  appId: 'app.positivethots',
  appName: 'Positive Thots',
  webDir: 'dist',
  server: {
    url: 'https://positivethots.lovable.app?forceHideBadge=true',
    cleartext: true
  }
};
```

**Files changed**:
- `package.json` — add Capacitor dependencies
- `capacitor.config.ts` (new)

After setup, the user will need to:
1. Export to GitHub and clone locally
2. Run `npm install`
3. Run `npx cap add ios` and/or `npx cap add android`
4. Run `npx cap sync` then `npx cap run ios` or `npx cap run android`

---

### Execution Order

| Step | What |
|------|------|
| 1 | Create Stripe products (Boost $2.99, Super Like Pack $1.99) |
| 2 | Database migration: `profile_boosts`, `super_likes`, `super_like_balance` tables + RLS + functions |
| 3 | Edge functions: `create-boost-payment`, `create-superlike-payment` |
| 4 | Frontend hooks: `useSuperLikes`, boost activation logic |
| 5 | UI updates: DiscoveryCard (super like + boosted badge), Profile (boost button), LikesYou (super like highlight) |
| 6 | Install Capacitor dependencies and create config |

