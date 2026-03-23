

# Remove White Background from Logo

## What needs to happen
1. Take the uploaded `logo_edited-3.png` and remove the white background to create a transparent PNG.
2. Present the cleaned image for your approval before replacing anything.
3. Once approved, overwrite `src/assets/logo.png` and regenerate `public/icon-512.png`.

## Technical approach
- Use Python with PIL/numpy to identify white pixels (near RGB 255,255,255) and set their alpha to 0.
- Apply edge anti-aliasing so the artwork edges blend smoothly against any background.
- Save the result to `/mnt/documents/` for your visual review.
- No code or component changes needed — same file paths are preserved.

## Expected outputs
- **For approval**: Cleaned transparent PNG rendered against both light and dark backgrounds
- **After approval**: Updated `src/assets/logo.png` and `public/icon-512.png`

