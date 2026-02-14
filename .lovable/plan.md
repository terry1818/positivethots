
# Three Changes: AI Profile Photos, Logo Prominence, and Dark/Light Mode Settings

## 1. AI-Generated Profile Images for Test Users

Update the `seed-test-users` edge function to use Lovable AI image generation (google/gemini-2.5-flash-image) to create realistic profile photos for each test user instead of DiceBear avatars.

**How it works:**
- For each test user, the function calls the Lovable AI gateway with a prompt tailored to the user's description (age, gender, vibe from their bio)
- The generated image is returned as base64, then uploaded to a Lovable Cloud storage bucket
- The public URL from the bucket is saved as `profile_image` on the profile

**Technical details:**
- Create a new storage bucket `profile-images` with public access for reading
- Update `seed-test-users/index.ts` to:
  1. Call `https://ai.gateway.lovable.dev/v1/chat/completions` with the `google/gemini-2.5-flash-image` model and a prompt like "Professional dating app profile photo of a [age]-year-old [gender] person, [descriptors from bio], warm lighting, natural smile, upper body portrait"
  2. Decode the base64 image response
  3. Upload to `profile-images` bucket with the user's ID as filename
  4. Use the public URL as `profile_image`
- For existing test users that were already created (skipped), the function will update their `profile_image` field with a newly generated image

## 2. Logo Prominence -- Front and Center Everywhere

Make the Positive Thots logo the hero element across all key screens:

- **Auth page**: Enlarge the logo to `lg` size and center it prominently above the card
- **Discover header**: Replace the Zap icon + "Discover" text with the Logo component (sm size, no text)
- **Learn header**: Add the Logo component alongside the XP bar and streak display
- **Bottom Nav**: No change needed (icons are standard nav convention), but add the logo to the top of the Profile page header
- **Onboarding**: The logo is already used -- bump it to `lg` size
- **Profile page header**: Replace the "My Profile" text with the Logo component

**Files to modify:**
- `src/pages/Auth.tsx` -- larger logo placement
- `src/pages/Index.tsx` -- logo in discover header
- `src/pages/Learn.tsx` -- logo in learn header
- `src/pages/Profile.tsx` -- logo in profile header
- `src/pages/Messages.tsx` -- logo in messages header

## 3. Dark/Light Mode Toggle in Settings

The project already has `next-themes` installed (used by `sonner.tsx`), but no ThemeProvider is set up. This needs to be wired up properly.

**Changes:**

### a) Add ThemeProvider to the app
- Wrap the app in `next-themes` `ThemeProvider` in `src/App.tsx`
- Set `attribute="class"` and `defaultTheme="system"` so Tailwind's `dark:` classes work

### b) Create a Settings page (`src/pages/Settings.tsx`)
- Accessible from Profile page via the existing Settings button
- Add a route `/settings` in `App.tsx`
- Settings page includes:
  - **Appearance section** with three options using radio buttons or a segmented control:
    - "Light" -- forces light mode
    - "Dark" -- forces dark mode  
    - "System" -- follows device preference (default)
  - Uses `useTheme()` hook from `next-themes` to read/set the theme
  - Clean UI with the Logo at the top, back button, and grouped settings cards

### c) Update Profile page
- Wire the Settings gear button to navigate to `/settings`

**Files to create:**
- `src/pages/Settings.tsx`

**Files to modify:**
- `src/App.tsx` -- add ThemeProvider wrapper + Settings route
- `src/main.tsx` -- no changes needed
- `src/pages/Profile.tsx` -- wire Settings button to navigate to `/settings`

**Storage setup:**
- Create `profile-images` storage bucket via database migration
