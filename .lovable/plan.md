

## Problem Analysis

Two issues visible in the screenshots:

1. **Discovery card photos crop heads** — The `BlurImage` uses `object-cover` which centers the image by default (`object-position: center`). For portrait/full-body photos, this cuts off heads. Users need a way to set a focal point per photo.

2. **Profile detail sheet photo is too small** — The `ProfileDetailSheet` uses a fixed `h-56` (224px) for the photo area regardless of screen size, wasting space on larger viewports. The full-profile view (image-49) shows the photo spanning full width but with no height constraint awareness.

## Plan

### 1. Add focal point support to user_photos

**Database migration:**
- Add `focal_point_y` column (DECIMAL, default 50) to `user_photos` — represents vertical percentage (0 = top, 50 = center, 100 = bottom). Only vertical axis needed since horizontal cropping rarely cuts important content.
- Update RLS policy to allow users to update this field.

### 2. Photo focal point selector in PhotoUploadGrid

**Edit `PhotoUploadGrid.tsx`:**
- Add a "Set Focus" button on each uploaded photo thumbnail.
- On tap, open a modal/sheet showing the full photo with a draggable horizontal line or tap-to-set-focus interaction.
- User taps where their face/subject is — saves the Y percentage to `focal_point_y`.
- Simple UX: show the photo full-size, tap the important area, done.

### 3. Pass focal point through to BlurImage

**Edit `BlurImage.tsx`:**
- Add optional `objectPosition` prop (e.g., `"center 30%"`).
- Apply it to the `<img>` element's `style` alongside `object-cover`.

### 4. Use focal point in Discovery cards

**Edit `SwipeDiscoveryCard.tsx`:**
- Fetch `focal_point_y` alongside photo URLs from `user_photos`.
- Pass `objectPosition={`center ${focalY}%`}` to `BlurImage`.

### 5. Use focal point in ProfileDetailSheet

**Edit `ProfileDetailSheet.tsx`:**
- Same focal point pass-through.
- Fix responsive height: change `h-56` to `h-[50vh] max-h-[400px]` so the photo area scales with viewport instead of being a fixed 224px.

### 6. Fix photo display on profile view across screen sizes

**Edit `ProfileDetailSheet.tsx`:**
- Replace fixed `h-56` with responsive classes: `h-[40vh] sm:h-[50vh] max-h-[500px]`.
- This ensures the photo area is proportional on both small phones and desktop viewports.

### Technical details

- `focal_point_y` defaults to 50 (center), so existing photos display unchanged.
- The focal point selector is a simple tap interaction — no complex drag needed. User sees full photo, taps where the subject's face is, a crosshair/indicator appears, they confirm.
- Discovery feed query already fetches from `user_photos` — just need to include the new column.
- `object-position: center ${y}%` is CSS-native and performant.

