

## Plan: Fix Photo Verification (iOS Camera + Private Bucket + Better AI Prompt)

3 fixes across 3 files + 1 migration.

---

### Fix 1: Replace custom camera UI with native file input

**File:** `src/components/VerificationCard.tsx`

- Remove: `showCamera` state, `videoRef`, `streamRef`, `startCamera`, `stopCamera`, `captureAndSubmit`, the `<video>` element, the camera toggle UI, and the `isNative()`/`takeNativePhoto()` branch
- Remove unused imports: `useCallback`, `X`, `isNative`, `takeNativePhoto`
- Replace with: a hidden `<input type="file" accept="image/*" capture="user">` + `fileInputRef`. Button click triggers the file input. `handleFileSelected` uploads the file directly to `verification-selfies` bucket, inserts `verification_requests`, invokes `moderate-photo`, and shows result toast.
- Improve rejected state styling: wrap in a `bg-destructive/10 rounded-lg p-3` card
- Add privacy note: "Your selfie is only used for verification and is never shown publicly."
- Upload target bucket changes from `user-photos` to `verification-selfies`

### Fix 2: Improve AI verification prompt

**File:** `supabase/functions/moderate-photo/index.ts`

- Replace the single-line AI prompt (line 143-144) with a detailed multi-rule prompt covering: facial feature comparison, tolerance for lighting/angle/accessories, quality rejection guidance, and no-face-detected handling
- Change selfie URL from `getPublicUrl` (line 109-111) to `createSignedUrl(path, 300)` since the bucket will now be private
- Upload source bucket changes from `user-photos` to `verification-selfies`

### Fix 3: Create private verification-selfies bucket

**Migration:**
- Create `verification-selfies` bucket with `public = false`
- RLS policy: users can INSERT into their own folder (`auth.uid()::text = (storage.foldername(name))[1]`)
- RLS policy: service role can SELECT (for edge function signed URL access — service role bypasses RLS, so no explicit policy needed)

---

### Files

| # | File | Change |
|---|------|--------|
| 1 | `src/components/VerificationCard.tsx` | Replace camera UI with file input, upload to private bucket |
| 2 | `supabase/functions/moderate-photo/index.ts` | Better AI prompt, signed URL, private bucket |
| 3 | 1 migration | Create `verification-selfies` private bucket + RLS |

