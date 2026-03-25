

## Plan: Fix Photo Verification — 4 Fixes

### Root Cause Analysis

The edge function logs show the **actual error**: `"Unsupported image format for URL: https://zcsnqvncqzpleqoctzfc.supabase.co/storage/v1/object/public/user-photos/..."`. The AI gateway cannot fetch images from Supabase storage URLs directly. This affects both the selfie (signed URL) and profile photos (public URLs).

Additionally, `anthropic/claude-3-5-haiku` is **not available** on the Lovable AI gateway. Only Google Gemini and OpenAI models are supported. The best vision model available is `google/gemini-2.5-pro`.

---

### Fix 1: Validate LOVABLE_API_KEY (line 60)

**File:** `supabase/functions/moderate-photo/index.ts`

Replace the `!` assertion with an explicit check that returns a 503 with a clear log message if missing.

### Fix 2: Convert images to base64 data URLs before sending to AI

**File:** `supabase/functions/moderate-photo/index.ts`

The core issue: the AI gateway rejects Supabase storage URLs. Fix by fetching each image and converting to a base64 data URL (`data:image/jpeg;base64,...`) before passing to the AI.

Add a helper function:
```
async function fetchImageAsDataUrl(url: string): Promise<string>
```
- Fetches the image bytes
- Detects content type from response headers (default `image/jpeg`)
- Returns `data:{mime};base64,{encoded}`

Apply this to:
- The selfie signed URL in `handleVerification`
- Each profile photo URL in `handleVerification`
- The photo URL in `handleModeration`

### Fix 3: Use `google/gemini-2.5-pro` for vision tasks

**File:** `supabase/functions/moderate-photo/index.ts`

Change `model: "google/gemini-2.5-flash"` to `model: "google/gemini-2.5-pro"` — this is the strongest vision model available and explicitly supports image+text reasoning.

### Fix 4: Add SELECT policy for verification-selfies bucket + better error logging

**Migration:** Add `SELECT` policy for `service_role` on `verification-selfies` bucket.

**File:** `supabase/functions/moderate-photo/index.ts` — Improve catch block logging with `err.message` and add response preview log after `callAI` returns.

---

### Files

| # | File | Change |
|---|------|--------|
| 1 | `supabase/functions/moderate-photo/index.ts` | Validate API key, base64 image conversion, model change, better logging |
| 2 | 1 migration | SELECT policy for verification-selfies bucket |

