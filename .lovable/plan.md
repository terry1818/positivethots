

## Plan: Rebuild CompactProgressBar + Rename "Super Like" → "Thot" and "It's a Match!" → "You Both Said Yes"

### Prompt 1 — Rebuild CompactProgressBar

**File: `src/components/discovery/CompactProgressBar.tsx`** — Full rewrite
- Rename prop `suggestionCount` → `connectionCount`
- Add `CheckCircle` import from lucide-react, add `cn` import
- Three sections:
  1. Stats row: three stacked stat columns (Badges/primary, Tiers/muted, Connections/success) + "Keep Learning" pill button right-aligned
  2. Next unlock card: icon + "Next unlock: {label}" + "{tier} · N badges needed" + "N to go" pill — or "All features unlocked" with CheckCircle
  3. Segmented bar with first-word tier labels above, h-2 bar segments with gap-1

**File: `src/pages/Index.tsx`**
- Add `matchCount` state (`useState(0)`)
- In `loadSuggestions`, after the existing matches query (line 197-199 already fetches matches), derive count: `const matchCount = matchesResult.data?.length || 0; setMatchCount(matchCount);`
- Update CompactProgressBar call: `suggestionCount={suggestions.length}` → `connectionCount={matchCount}`

### Prompt 2 — Rename "Super Like" → "Thot" / "It's a Match!" → "You Both Said Yes"

User-visible text changes only. No variable/function/DB renames.

**File: `src/pages/Index.tsx`** (6 changes)
- Line 141: `"Super Likes purchased! 🌟"` → `"Thots purchased! 💜"`, description → `"10 Thots added to your balance."`
- Line 271: `"It's a Match! 💕"` → `"You Both Said Yes 💜"`, keep description
- Line 291: `"No Super Likes left"` → `"No Thots left"`
- Line 305: `"It's a Match! 💕", { description: "Your Super Like worked!" }` → `"You Both Said Yes 💜", { description: "Your Thot worked!" }`
- Line 307: `"Super Like Sent! ⭐"` → `"Thot Sent! 💜"`
- Line 446-449: Change `Star` icon to `Heart` with `fill-current text-primary`, tooltip/aria-label → "Thots remaining"

**File: `src/components/MatchModal.tsx`** (2 changes)
- Line 75: `"It's a Match!"` → `"You Both Said Yes"`
- Line 77: `"liked each other"` → `"connected 💜"`

**File: `src/components/discovery/DiscoveryCard.tsx`** (2 changes)
- Line 45: `"Out of Super Likes!"` → `"No Thots left!"`
- Line 177: title attr `"Super Like"` → `"Send a Thot"`

**File: `src/components/education/CelebrationModal.tsx`** (2 changes)
- Line 27: `"bonus Super Like! ⭐"` → `"bonus Thot! 💜"`
- Line 29: `"3 Super Likes"` → `"3 Thots"`

**File: `src/pages/LikesYou.tsx`** (2 changes)
- Line 108: `"It's a match!"` → `"You Both Said Yes 💜"`
- Line 189: `>Super Like<` → `>Thot<`

**File: `src/pages/Onboarding.tsx`** (2 changes)
- Line 772: `"5 Super Likes/day"` → `"5 Thots/day"`
- Line 774: `"Unlimited Super Likes"` → `"Unlimited Thots"`

**File: `src/pages/Profile.tsx`** (1 change)
- Line 384: `"Unlimited Super Likes"` → `"Unlimited Thots"`

**File: `src/pages/Premium.tsx`** (1 change)
- Line 259: `"1 daily Super Like"` → `"1 daily Thot"`

**File: `src/lib/subscriptionTiers.ts`** (4 changes)
- `FEATURE_LABELS.super_likes`: `"5 Super Likes/day"` → `"5 Thots/day"`
- `FEATURE_LABELS.unlimited_super_likes`: `"Unlimited Super Likes"` → `"Unlimited Thots"`
- `ONE_TIME_PRODUCTS.super_like_pack_5.name`: → `"Thot Pack (5)"`
- `ONE_TIME_PRODUCTS.super_like_pack_10.name`: → `"Thot Pack (10)"`

### Files Summary

| File | Changes |
|------|---------|
| `src/components/discovery/CompactProgressBar.tsx` | Full rewrite with 3-section layout |
| `src/pages/Index.tsx` | Add matchCount state, update CompactProgressBar prop, rename 6 toast strings, change Thot balance icon |
| `src/components/MatchModal.tsx` | Rename heading + body text |
| `src/components/discovery/DiscoveryCard.tsx` | Rename toast + title |
| `src/components/education/CelebrationModal.tsx` | Rename streak rewards |
| `src/pages/LikesYou.tsx` | Rename toast + badge |
| `src/pages/Onboarding.tsx` | Rename tier features |
| `src/pages/Profile.tsx` | Rename feature label |
| `src/pages/Premium.tsx` | Rename free tier feature |
| `src/lib/subscriptionTiers.ts` | Rename labels + pack names |

### Not Changed
Database columns, hook names (`useSuperLikes`), edge functions, analytics event strings, Stripe product names, SwipeCard.tsx, ProfileDetailSheet.

