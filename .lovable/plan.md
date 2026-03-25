

## Plan: Cookie Banner Fix + Photo Verification Fix

### Prompt 1 — Cookie Banner Fix

**3 surgical changes, no other animations affected:**

1. **`src/index.css` (lines 181-182):** Change `translate(-50%, 20px)` → `translateY(20px)` and `translate(-50%, 0)` → `translateY(0)`

2. **`tailwind.config.ts` (lines 117-118):** Same change in the JS keyframes config

3. **`src/components/CookieConsent.tsx`:** Add `max-h-[90vh] overflow-y-auto` to the Card component

---

### Prompt 2 — Photo Verification Fix

**4 changes across 3 files:**

1. **`supabase/functions/moderate-photo/index.ts` (after line 120):** Early return with clear error message when `photoUrls.length === 0`, before calling the AI. Updates the verification_request to "rejected" with reason explaining photos must be approved first.

2. **`src/components/VerificationCard.tsx`:** Add `hasApprovedPhotos: boolean` prop. When false, render an info card telling the user to upload and wait for photo approval instead of showing the verification UI.

3. **`src/components/VerificationCard.tsx` (lines 68-74):** In the native branch, add `toast.error` message and `onVerificationChange()` call when `takeNativePhoto()` returns null, so the UI resets properly.

4. **`src/pages/EditProfile.tsx`:** Pass `hasApprovedPhotos={photos.some(p => p.moderation_status === 'approved')}` to `VerificationCard`.

---

### Files touched

| # | File | Change |
|---|------|--------|
| 1 | `src/index.css` | Fix slide-up keyframe |
| 2 | `tailwind.config.ts` | Fix slide-up keyframe |
| 3 | `src/components/CookieConsent.tsx` | Add max-height + overflow |
| 4 | `supabase/functions/moderate-photo/index.ts` | Early return when no approved photos |
| 5 | `src/components/VerificationCard.tsx` | New prop + native failure handling |
| 6 | `src/pages/EditProfile.tsx` | Pass hasApprovedPhotos prop |

