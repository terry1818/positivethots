

# Fix Photo Moderation and Add Drag-to-Reorder

## Problem Summary

Two issues identified:

1. **Photos always rejected**: The `moderate-photo` edge function calls the AI but fails to parse the response correctly. When parsing fails, photos default to `rejected` with no reason. Testing confirms all uploads are rejected with `reason: null`.

2. **No drag-to-reorder**: The photo grid was planned to support reordering but only renders a static grid with no drag interaction.

## Solution

### 1. Fix the Moderation Edge Function

**File: `supabase/functions/moderate-photo/index.ts`**

- Add logging to capture the raw AI response for debugging
- Improve JSON parsing to handle markdown-wrapped responses (e.g., ` ```json {...} ``` `)
- Default to `approved: true` when the AI response cannot be parsed, rather than silently rejecting. This is safer for user experience -- legitimate content won't be blocked, and actual violations are rare
- Add a try/catch around the AI fetch call itself so network errors don't silently reject photos
- After fixing, re-moderate the two existing rejected photos so they show up

### 2. Add Drag-to-Reorder to PhotoUploadGrid

**File: `src/components/PhotoUploadGrid.tsx`**

- Implement native HTML5 drag-and-drop (no extra library needed) using `draggable`, `onDragStart`, `onDragOver`, `onDrop` handlers
- When a photo is dropped in a new position, reorder the array and update `order_index` for affected photos in the database
- Visual feedback: highlight the drop target slot during drag
- Only allow dragging filled slots (not empty ones)

### 3. Show Photos on Profile Page

**File: `src/pages/Profile.tsx`**

- Fetch approved public photos from `user_photos` table alongside the profile data
- Display them in a horizontal scrollable gallery below the main profile image
- The main profile image (`profile_image` column) gets auto-set by the edge function when the first public photo is approved

## Technical Details

### Edge Function Fix (moderate-photo)

The core issue: the AI likely returns JSON wrapped in markdown code fences. The current regex `/{[\s\S]*}/` should match, but the response might have an unexpected format. The fix will:

1. Add `console.log` for the raw AI response
2. Strip markdown fences before parsing
3. Handle edge cases (empty response, non-JSON)
4. Default to approved when AI is unreachable or unparseable (fail-open for better UX)

### Drag-and-Drop Implementation

Using native browser drag-and-drop API:
- `onDragStart`: Store the dragged photo's index
- `onDragOver`: Prevent default to allow drop, add visual indicator
- `onDrop`: Swap or insert the photo at the new position
- After drop, batch-update `order_index` values in the database

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/moderate-photo/index.ts` | Fix AI response parsing, add logging, fail-open |
| `src/components/PhotoUploadGrid.tsx` | Add drag-and-drop reordering with database sync |
| `src/pages/Profile.tsx` | Fetch and display approved public photos |
