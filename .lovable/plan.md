

## Location Sharing Feature (Unlocked via Foundation Badges)

Users who complete the 5 Foundation education modules unlock the ability to share their live GPS location at events, so nearby users can find each other.

### How it works

1. **Unlock gate**: Location sharing toggle only appears for users who have earned all 5 Foundation badges (same check used to gate Discovery access)
2. **Opt-in toggle**: Users enable/disable location sharing from Settings or a floating button on the Discovery/Events page
3. **Real-time GPS**: When enabled, the browser's Geolocation API captures lat/lng and writes it to a `user_locations` table
4. **Nearby users**: Other opted-in users within a configurable radius (e.g. 500m) appear on a "Nearby" card or map view
5. **Auto-expire**: Locations auto-expire after a set period (e.g. 2 hours) for privacy — enforced via a `expires_at` column

### Database

New `user_locations` table:

```text
user_locations
├── id (uuid, PK)
├── user_id (uuid, NOT NULL)
├── latitude (double precision, NOT NULL)
├── longitude (double precision, NOT NULL)
├── is_sharing (boolean, default false)
├── updated_at (timestamptz, default now())
└── expires_at (timestamptz, default now() + 2 hours)
```

RLS policies:
- Users can upsert/read their own row
- Authenticated users can SELECT other users' rows WHERE `is_sharing = true AND expires_at > now()`
- Enable realtime on the table for live updates

### New files

| File | Purpose |
|------|---------|
| `src/hooks/useLocationSharing.ts` | Hook: checks Foundation badge unlock, manages Geolocation API, upserts to `user_locations`, handles toggle state |
| `src/components/NearbyUsers.tsx` | Card/list showing opted-in nearby users with distance, subscribes to realtime changes |

### Changes to existing files

| File | Change |
|------|--------|
| `src/pages/Settings.tsx` | Add "Location Sharing" card with toggle (grayed out with "Complete Foundation courses to unlock" message if not unlocked) |
| `src/pages/Index.tsx` | Add a "Nearby" section/button that links to or expands the NearbyUsers component when location sharing is active |

### Distance calculation

Use the Haversine formula client-side to compute distances from the current user's coordinates to other sharing users. For the MVP this is sufficient; a PostGIS RPC can be added later for server-side filtering.

### Privacy safeguards

- Location is never stored permanently — rows expire after 2 hours
- Users must explicitly opt in each session (no persistent background tracking)
- Toggle clearly communicates what sharing means
- Only users who have also completed Foundation courses can see nearby users

### Steps

1. Create `user_locations` table with RLS policies and realtime via migration
2. Create `useLocationSharing` hook
3. Create `NearbyUsers` component
4. Add Location Sharing card to Settings page
5. Add Nearby section to Discovery page

