

## Plan: Fix Authentication Issues (Signup + Login)

### Root Causes Identified

After testing the auth flow and inspecting the database, I found two distinct problems:

1. **Signup fails silently with unconfirmed email**: When a user signs up, email confirmation is required (correct behavior). However, the code assumes `authData.user` being present means the session is active. It then tries to insert a profile via `supabase.from("profiles").insert(...)` — but RLS requires `auth.uid() = id`, which fails because there's no active session yet. The profile insert fails, the user sees an error ("Failed to create profile"), and they're stuck — they can't retry signup ("User already registered") and can't log in (email unconfirmed).

2. **Weak password error (HIBP)**: The HIBP check rejects compromised passwords with a technical error message. Users don't understand what "known to be weak and easy to guess" means in context.

**Evidence**: User `terryleerhea@gmail.com` signed up, `email_confirmed_at` is NULL, and no profile row exists — confirming the exact failure path.

### Fix

**File: `src/pages/Auth.tsx`**

Three changes to the `handleAuth` function:

1. **Handle unconfirmed signup correctly**: After `signUp()`, check if `authData.user` exists but `authData.session` is null — this means email confirmation is pending. Show a success message telling the user to check their email, and do NOT attempt profile creation or navigation. The profile will be created after email confirmation.

2. **Create profile on first login instead**: Move profile creation logic so it runs during sign-in when a confirmed user has no profile yet. After successful `signInWithPassword`, check if a profile exists; if not, create one using the user's metadata (`name`, `age` from `raw_user_meta_data`).

3. **Better HIBP error handling**: Detect `AuthWeakPasswordError` specifically and show a user-friendly message: "This password has been found in a data breach. Please choose a different, unique password."

**File: `src/pages/Auth.tsx`** — updated `handleAuth`:

```
// SIGNUP path changes:
if (authData.user && !authData.session) {
  // Email confirmation required — don't create profile yet
  toast.success("Check your email to confirm your account before signing in.");
  return;
}

// SIGNIN path changes:
// After successful signInWithPassword, check for missing profile
const { data: existingProfile } = await supabase
  .from("profiles").select("id").eq("id", signInData.user.id).maybeSingle();
if (!existingProfile) {
  // Create profile from user metadata
  await supabase.from("profiles").insert({...});
}

// ERROR handling changes:
if (error.name === "AuthWeakPasswordError") {
  toast.error("This password has appeared in a data breach. Please choose a different, more unique password.");
}
```

### Summary of Changes

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Fix signup to handle email confirmation pending state; create profile on first login if missing; improve HIBP error message |

