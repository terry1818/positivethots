
# Rebuild Logo From Clean Upload

## What I found
- The app logo component imports `src/assets/logo.png`.
- The favicon/app icon is served from `public/icon-512.png` via `index.html`.
- A clean replacement source already exists in the repo as `src/assets/logo-rebuild-source.png`.

## Implementation plan
1. Replace the damaged logo asset by rebuilding `src/assets/logo.png` from the clean uploaded source, instead of trying to “remove” the baked background from the corrupted file again.
2. Preserve true transparency in the rebuilt logo so it renders correctly on all page backgrounds.
3. Generate a proper square `public/icon-512.png` from the same clean source, cropped/padded thoughtfully so the artwork fits well as a favicon and app icon.
4. Keep the existing asset paths the same so no React component changes are needed:
   - `src/components/Logo.tsx` can continue importing `@/assets/logo.png`
   - `index.html` can continue referencing `/icon-512.png`
5. QA both outputs visually against light and dark backgrounds to make sure:
   - no white matte or checkerboard remains
   - edges are clean
   - the favicon composition is centered and readable at small sizes

## Expected file updates
- `src/assets/logo.png`
- `public/icon-512.png`

## Technical notes
- I would use the clean uploaded image as the new master, not the previously edited asset.
- If the uploaded source still contains a visible white background baked into the pixels, I would rebuild transparency from the clean source with a tighter mask/manual cleanup pass before exporting the final PNGs.
- No backend or database changes are involved.
