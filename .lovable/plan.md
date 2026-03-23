

# Edit Logo and Update Favicon

## Step 1: Edit the Logo
Use the AI image editing API (Nano banana pro for higher quality) to modify `src/assets/logo.png`:
- **Remove** the "twitch.tv/forsale18" text from below the woman figure
- **Keep** "Positive Thots" text above the woman
- **Keep** the overall pinup style, colors, and composition intact

The edited logo will be saved and presented for your approval before proceeding.

## Step 2: After Approval — Update the App
- Replace `src/assets/logo.png` with the approved version
- Replace `public/icon-512.png` with a square-cropped version for the app favicon/icon

## Step 3: After Approval — Update the Marketing Site
- Embed the updated logo into the `index.html` marketing file (or reference it as a hosted asset)
- Fix the favicon `<link>` tag in the marketing HTML to point to the correct icon file so the tab icon displays properly

### Technical Notes
- The app's `Logo.tsx` component references `src/assets/logo.png` — no code change needed if the filename stays the same
- The app's `index.html` already references `/icon-512.png` for favicon — just needs the image file updated
- The marketing site's `index.html` needs a proper `<link rel="icon">` tag added

