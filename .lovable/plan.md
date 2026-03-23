
Plan

1. Verify the actual failure path, not just the UI message.
   - The frontend call is correct: it sends password reset to `/reset-password`.
   - The backend auth logs show real `429 over_email_send_rate_limit` responses from the auth service, so this is not just a misleading toast.
   - The same account (`yeaimforsale@gmail.com`) hit `/recover` multiple times within about 2 minutes, which is why the provider blocked more sends.

2. Fix the product behavior so users don’t get trapped by this.
   - Add a dedicated “Forgot password” flow instead of the current inline link-only behavior.
   - Move reset sending into a small modal or dedicated screen with:
     - clear email field validation
     - loading state
     - single-submit protection
     - disabled resend cooldown on the client
   - This prevents accidental repeated submits, double clicks, and spammy retries.

3. Stop hidden duplicate triggers.
   - Audit the auth screen and related session/auth listeners for anything that may re-trigger recovery or remount unexpectedly.
   - Specifically verify:
     - the forgot-password action only fires on explicit click
     - no route transition or recovery-page logic is causing extra recover requests
     - no browser autofill/form submission edge case is invoking it more than once

4. Improve reset request handling.
   - Add a local debounce / in-flight guard so only one recovery request can be sent at a time.
   - Persist a short client-side cooldown timestamp per email so refreshes/remounts don’t immediately allow repeat requests.
   - Keep the UX honest: show “email sent” only on success, and show a specific explanation if the backend truly rejects the request.

5. Verify the email delivery path end-to-end.
   - Check that the custom auth email setup is actually active for password recovery, since there are currently no recovery entries in the email send log and no recent auth-email-hook logs for recovery sends.
   - Confirm the reset email is being handed off to the project’s branded auth email pipeline and not failing before queueing.

6. If the custom email hook is not active, repair that integration.
   - Reconnect the auth recovery email flow to the existing branded email setup.
   - Ensure password reset requests enqueue and send properly through the project’s email system.
   - Re-test with one controlled request and confirm the reset email is logged and delivered.

7. Final validation after implementation.
   - Test these cases:
     - first reset request for an existing confirmed user
     - repeated click protection
     - expired/used reset link behavior
     - reset password submission on `/reset-password`
     - mobile + desktop auth flow
   - Confirm there are no duplicate recovery calls and the user can actually complete the reset successfully.

Technical notes
- Current evidence indicates two issues may exist at once:
  1. real auth-provider throttling caused by repeated `/recover` requests
  2. possible custom auth email pipeline not logging recovery sends as expected
- The plan should fix both the usability problem and the backend delivery gap so reset works reliably instead of just showing a friendlier error.
