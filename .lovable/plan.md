

## Plan: Learning Journal Page

### Part A — New Page: `src/pages/LearningJournal.tsx`

Create a new page at route `/journal`. Requires auth via `useRequireAuth`.

**Data query:**
```typescript
supabase
  .from("user_reflections")
  .select("*, module_sections!inner(title, section_number, module_id, education_modules!inner(title, slug, tier))")
  .eq("user_id", session.user.id)
  .order("created_at", { ascending: false })
```

**Layout:**
- Header with back button (navigates to `/settings`) + "My Learning Journal" title
- Group reflections by module (using `education_modules.title`)
- Each module group: badge emoji (from `EducationBadge` `badgeIcons` map) + module title as section header
- Each reflection: card with section title, formatted date ("March 15"), response text
- Empty state with BookOpen icon and message
- No BottomNav

**Route:** Add lazy import + `/journal` route in `App.tsx`

### Part B — Settings Link

In `src/pages/Settings.tsx`, add a new "Learning" card between the "Change Password" card and the "Data & Privacy" card containing a single button:
- BookOpen icon + "Learning Journal" label
- `onClick={() => navigate("/journal")}`

### Files

| # | File | Change |
|---|------|--------|
| 1 | `src/pages/LearningJournal.tsx` | New page component |
| 2 | `src/App.tsx` | Add lazy import + `/journal` route |
| 3 | `src/pages/Settings.tsx` | Add Learning Journal link card |

No database changes needed — `user_reflections` table and `module_sections` foreign key already exist.

