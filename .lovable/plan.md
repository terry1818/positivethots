

# Fix Auth Emails: Wrong Sender Name + Broken Reset Link

## Root Causes Found

### Issue 1: "swipe-right-recreate" sender name
In `supabase/functions/auth-email-hook/index.ts` line 39:
```
const SITE_NAME = "swipe-right-recreate"
```
This is used on line 259 to construct the `from` field: `swipe-right-recreate <noreply@positivethots.app>`. That's why every email shows the old project name.

Also line 49: `SAMPLE_PROJECT_URL = "https://swipe-right-recreate.lovable.app"` — wrong for previews.

### Issue 2: Reset link redirects to wrong URL
The password reset link in the email uses `confirmationUrl` from `payload.data.url` (line 225), which Supabase Auth generates based on the `redirectTo` parameter. The `ForgotPasswordModal` correctly passes `${window.location.origin}/reset-password`, but the Supabase project's allowed redirect URLs may not include the published domain (`positivethots.lovable.app`), causing it to fall back to a default Lovable URL.

## Changes

### 1. Fix auth-email-hook configuration (line 39 and 49)
**File:** `supabase/functions/auth-email-hook/index.ts`
- Change `SITE_NAME` from `"swipe-right-recreate"` to `"Positive Thots"`
- Change `SAMPLE_PROJECT_URL` from `"https://swipe-right-recreate.lovable.app"` to `"https://positivethots.lovable.app"`

### 2. Update auth redirect URL configuration
Configure the authentication system to include `https://positivethots.lovable.app` in the allowed redirect URLs so password reset links point to the correct site instead of a default URL.

### 3. Redeploy the auth-email-hook edge function
Required for the name change to take effect — edge functions serve deployed code, not source code.

### 4. End-to-end test
- Trigger a fresh password reset email and verify:
  - Sender shows "Positive Thots" (not "swipe-right-recreate")
  - Reset link goes to `positivethots.lovable.app/reset-password` (not lovable.ai)
  - The reset password form works and updates the password
- Trigger a fresh signup verification email and verify the same sender name fix

## Technical Notes
- The email templates themselves (recovery.tsx, signup.tsx, etc.) are already correctly branded with "Positive Thots" text and logo. The problem is only in the edge function's configuration constants.
- The `from` field in sent emails is constructed as `${SITE_NAME} <noreply@${FROM_DOMAIN}>`, so fixing `SITE_NAME` fixes the display name in all auth emails at once.

