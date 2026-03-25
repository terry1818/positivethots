

## Plan: Feature Milestone Cards, XP Reward Bar, Events Gate & Location Split

### Overview
Three prompts, six files modified. No database changes needed.

---

### Prompt 1 — Feature Unlock Milestone Cards in TierRoadmap

**File: `src/hooks/useFeatureUnlocks.ts`**
- Update `TIER_FEATURES` to match the new structure:
  - Foundation: `discovery`, `distance_radar`, `basic_matching` (replaces `location_sharing`)
  - Sexual Health: unchanged keys, updated descriptions
  - Identity: unchanged keys, updated descriptions
  - Relationships: unchanged keys, updated descriptions  
  - Advanced: `events_access`, `event_location_sharing`, `mentor_badge`, `premium_content` (removes `event_creation`)

**File: `src/components/education/TierRoadmap.tsx`**
- **Remove** the emoji icon block from tier header pills (lines 254–269 — the `{node.features.length > 0 && ...}` block with hover tooltips)
- **Add** a milestone card after each tier header in the `allNodes.map()` loop. When `node.type === "tier-header"` and `node.features.length > 0`, render a `max-w-xs` card below the pill showing:
  - Header: "✓ Unlocked" (green) or "🔒 Complete this tier to unlock"
  - Each feature as a row: emoji icon, label (bold), description (muted), CheckCircle or Lock icon
  - Green border/bg tint when tier is complete, muted border when incomplete
  - `isTierComplete` flag already computed at line 235 — reuse it
- Add `relative z-10` to the card container so it sits above the connector line

---

### Prompt 2 — XP Bar Shows Next Reward

**File: `src/hooks/useLearningStats.ts`**
- Export `LEVEL_REWARDS` map: `{ 3: "+1 Super Like 💜", 5: "Streak Freeze ❄️", 7: "+2 Super Likes 💜💜", 10: "Free Profile Boost 🚀" }`
- Export `getNextReward(currentLevel)` function returning the next reward level above current, or null

**File: `src/components/education/XPBar.tsx`**
- Import `getNextReward` and `getLevelName`
- Add a second row below the progress bar:
  - Left: "{X} XP to {NextLevelName}" (or "Level up!" when at threshold)
  - Right: "Next reward at Lv.{N}: {icon} {label}" (hidden if no more rewards)
- Update level display from `Lv.{level}` to `Lv.{level} → {level+1}`

**File: `src/pages/LearnModule.tsx`**
- Import `LEVEL_REWARDS` from useLearningStats
- In `handleSectionComplete`, after the existing `result.leveledUp` block (line 190–191), add a reward toast:
  - Check `LEVEL_REWARDS[newLevel]`, if exists show `toast.success` with reward info after a 2400ms delay

---

### Prompt 3 — Events Gate + Location Split

**File: `src/hooks/useLocationSharing.ts`**
- Add `isEventLocationUnlocked` state (default false)
- In `checkUnlock`, after the existing foundation check, query advanced tier modules + user badges to determine advanced completion
- Return `isEventLocationUnlocked` alongside existing `isUnlocked`

**File: `src/pages/Settings.tsx`**
- Destructure `isEventLocationUnlocked` from `useLocationSharing()`
- Replace the single "Location Sharing" card (lines 449–496) with two cards:
  - **Card 1 — "Distance Radar 📡"**: Foundation gate, existing toggle
  - **Card 2 — "Event Location Sharing 📍"**: Locked if foundation incomplete → locked if advanced incomplete → toggle if both complete

**File: `src/pages/Events.tsx`**
- Import `useFeatureUnlocks` and use existing `useSubscription`
- Compute `hasEventsAccess = isFeatureUnlocked("events_access")`, `isVIP = subscriptionTier === "vip"`, `isFullyUnlocked`
- Three render branches:
  1. **`!hasEventsAccess`**: Blurred skeleton cards (3 placeholders) + centered overlay with curriculum checklist and "Continue Learning →" CTA
  2. **`hasEventsAccess && !isVIP`**: VIP upgrade banner + real event cards with "VIP Required 👑" buttons replacing "Get Ticket"
  3. **`isFullyUnlocked`**: Existing behavior unchanged
- Dynamic subtitle: "Complete the full curriculum..." / "Upgrade to VIP..." / "Learn, connect, and grow" + VIP badge

---

### Files Modified

| File | Changes |
|------|---------|
| `src/hooks/useFeatureUnlocks.ts` | Update TIER_FEATURES keys and descriptions |
| `src/components/education/TierRoadmap.tsx` | Remove emoji tooltips, add milestone cards below tier headers |
| `src/hooks/useLearningStats.ts` | Export LEVEL_REWARDS map + getNextReward helper |
| `src/components/education/XPBar.tsx` | Add reward hint row below progress bar |
| `src/pages/LearnModule.tsx` | Add reward toast on level-up |
| `src/hooks/useLocationSharing.ts` | Add isEventLocationUnlocked state + advanced tier check |
| `src/pages/Settings.tsx` | Split location card into Distance Radar + Event Location Sharing |
| `src/pages/Events.tsx` | Add education + VIP triple-gate UI |

### Not Changed
Event purchase flow, checkout edge functions, event registration, BottomNav, PhotoUploadGrid, EditProfile, badge/XP award logic, celebration modal, database schema.

