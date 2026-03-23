

# Add "Next Unlock" to CompactProgressBar

## What
Show the next locked feature and how close the user is to unlocking it, as a small text line between the stats row and the progress bar.

## Changes

**File: `src/components/discovery/CompactProgressBar.tsx`**

- Find the first incomplete tier from the `tiers` array
- Get the first feature from that tier's `features` list (the emoji + label)
- Add a single line below the stats row: e.g. `🛡️ Next: STI Status Sharing — 2/4 badges`
- If all tiers are complete, show nothing (or "All features unlocked ✓")
- Uses data already available via the `TierUnlock` type (which includes `features` array with `icon`, `label`, `isUnlocked`)
- Keeps the component height minimal — just one extra ~16px text line

