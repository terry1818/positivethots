

## Plan: Extend Admin Analytics with Success Metrics Dashboard

### Overview

Add 7 new KPI metrics to the Admin Analytics tab by creating a new database RPC that computes all metrics server-side in a single query, then rendering them in a new "Success Metrics" card grid below the existing funnel metrics.

### Database Migration

Create a new `get_success_metrics` security-definer RPC that calculates all 7 metrics from existing tables (no new tables needed):

```sql
CREATE OR REPLACE FUNCTION public.get_success_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
```

**Metrics computed:**

| Metric | SQL Logic | Tables Used |
|--------|-----------|-------------|
| Day-7 retention | Users with `created_at` > 7 days ago who have `analytics_events` in last 7 days ÷ users who signed up 7-14 days ago | `profiles`, `analytics_events` |
| Sessions per DAU | Count of distinct (user_id, date) event groups with >1 event ÷ distinct active users in last 7 days | `analytics_events` |
| Module completion rate | Distinct (user_id, module_id) in `user_badges` ÷ distinct (user_id, module_id) in `user_section_progress` | `user_badges`, `user_section_progress`, `module_sections` |
| Foundation completion | Users with 5+ badges from foundation-tier modules ÷ total registered users | `user_badges`, `education_modules`, `profiles` |
| Quiz pass rate | Quiz submissions with score ≥ 80 ÷ total quiz submissions (from `xp_transactions` where source = 'quiz_pass' or 'quiz_perfect' vs all quiz sources) | `xp_transactions` |
| Streak 7-day rate | Users with `current_streak` ≥ 7 in `user_learning_stats` ÷ active users (last 14 days) | `user_learning_stats` |
| Reflection completion rate | Distinct (user_id, section_id) in `user_reflections` ÷ total section completions where sections have reflection prompts | `user_reflections`, `user_section_progress`, `module_sections` |

All data comes from existing tables. The RPC returns a single jsonb object with all values as percentages/decimals.

### Frontend Changes

**File: `src/components/admin/AnalyticsTab.tsx`**

- Add state for success metrics
- Call `supabase.rpc("get_success_metrics")` alongside existing `get_funnel_metrics`
- Render a new "Success Metrics" section below the funnel grid with:
  - 7 metric cards in a 2-column grid
  - Each card shows: metric name, current value, target value (hardcoded), and a color indicator (red/yellow/green based on proximity to target)
  - Targets from the spec: Day-7 retention >35%, Sessions/DAU >1.8, Module completion >55%, Foundation completion >40%, Quiz pass >70%, Streak 7-day >22%, Reflection rate >30%

### Technical Details

- Single new RPC keeps admin queries efficient (one round-trip)
- RPC is `SECURITY DEFINER` so it can read across all users' data
- No RLS changes needed — the RPC bypasses RLS by design
- The types.ts file will auto-update after migration

### Files Changed

| File | Change |
|------|--------|
| New migration SQL | `get_success_metrics` RPC |
| `src/components/admin/AnalyticsTab.tsx` | Add success metrics section with 7 KPI cards |

