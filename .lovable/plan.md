

## Plan: Reflection Prompts + Session Intro Screen

### Part A — Database Migration

One new migration that:

1. Adds `reflection_prompt TEXT` column to `module_sections`
2. Creates `user_reflections` table:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `user_id UUID NOT NULL` (no FK to auth.users per project guidelines)
   - `section_id UUID REFERENCES module_sections(id) ON DELETE CASCADE`
   - `response_text TEXT NOT NULL`
   - `created_at TIMESTAMPTZ DEFAULT NOW()`
   - `UNIQUE(user_id, section_id)`
3. Enables RLS on `user_reflections` with policies:
   - SELECT own rows: `auth.uid() = user_id`
   - INSERT own rows: `auth.uid() = user_id`
   - UPDATE own rows: `auth.uid() = user_id`

### Part B — Reflection Prompt UI in SectionContent.tsx

Replace the existing hardcoded "Quick Reflection" block (lines 295-307) with a data-driven ReflectionPrompt component:

- New props on SectionContent: `reflectionPrompt?: string | null`, `userId?: string`, `onReflectionSaved?: () => void`
- If `reflectionPrompt` is non-null, render a styled card:
  - "Take a moment to reflect 💭" header
  - The `reflectionPrompt` text as the question
  - Textarea (min 2 rows), disabled until user types >= 20 chars for submit
  - "Save & Continue (+5 XP) →" button — on click: upsert to `user_reflections`, call parent's `awardXP(5, 'reflection', sectionId)`, then `onComplete()`
  - "Skip reflection" link — proceeds without XP
  - If reflection already saved (loaded on mount via SELECT), show pre-filled with "Edit" toggle
  - Footer: "Your reflections are private and saved to your Learning Journal."
- If `reflectionPrompt` is null/undefined, render nothing (removes the old hardcoded reflection)
- SectionContent loads existing reflection on mount via `supabase.from('user_reflections').select().eq('user_id', userId).eq('section_id', section.id).maybeSingle()`

### Part C — Pass reflection data through LearnModule.tsx

- Update the `Section` interface in `useModuleProgress.ts` to include `reflection_prompt: string | null`
- In LearnModule.tsx, pass `reflectionPrompt={sections[currentSectionIndex].reflection_prompt}` and `userId={userId}` to SectionContent
- Wire up an `onReflectionSaved` callback that calls `awardXP(5, 'reflection', sectionId)` and shows XP popup

### Part D — SessionIntro Component

Create `src/components/education/SessionIntro.tsx`:
- Props: `moduleTitle`, `sectionTitle`, `estimatedMinutes`, `xpAvailable`, `onStart`, `badgeSlug`, `badgeTier`
- Full-screen overlay (`fixed inset-0 z-50 bg-background flex items-center justify-center`)
- Centered layout with EducationBadge (size "lg"), section title, three stat chips, "Start Learning →" button
- Auto-dismiss after 3 seconds via `setTimeout` calling `onStart`

### Part E — SessionIntro integration in LearnModule.tsx

- Add `introShownSections` state as `Set<string>`
- Add `showSessionIntro` boolean state
- When `currentSectionIndex` changes: if section ID not in `introShownSections` AND section not completed, set `showSessionIntro = true` and add ID to set
- XP calculation: base 10 + (section has `reflection_prompt` ? 5 : 0)
- Render `SessionIntro` overlay conditionally above the section content

---

### Files

| # | File | Change |
|---|------|--------|
| 1 | 1 migration | Add `reflection_prompt` column, create `user_reflections` table + RLS |
| 2 | `src/hooks/useModuleProgress.ts` | Add `reflection_prompt` to Section interface |
| 3 | `src/components/education/SectionContent.tsx` | Replace hardcoded reflection with data-driven ReflectionPrompt, add new props |
| 4 | `src/components/education/SessionIntro.tsx` | New component — full-screen section intro overlay |
| 5 | `src/pages/LearnModule.tsx` | Pass reflection props, wire XP, add SessionIntro state + rendering |

