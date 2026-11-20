# Compliance copy fixes
- [x] Restore member quiz/checkpoint loading and server grading; verify real-answer submission, retries, private keys, pass/fail, persisted badge, and celebration.
- [ ] Verify an administrator's quiz flow: no administrator session available; requesting account is a regular member and temporary-account approval is unavailable.
- [x] Apply only the requested domain, auth, description, policy, and cancellation-button edits.
- [x] Verify prohibited-copy searches, signup, policy pages, and signed-in Settings. Build reported OK.
- [ ] Verify paid-plan Cancel Subscription click: requesting account is on the free plan; do not change account or payment data.

# Profile-edit crash
- [x] Reproduce the signed-in direct-load error and check history before 1991dff.
- [x] Fix the router context without changing profile copy, layout, or photo consent.
- [x] Verify signed-in direct loading, unsaved navigation, and unchanged consent/photo state.

# Remove merchandise storefront
- [x] Remove storefront links, copy, dead pages, cart code, and deployed proxy without changing other features or database tables.
- [x] Verify build, signed-in Profile, and zero obsolete integration/domain references; existing profile-edit regression also passed with consent/photos unchanged.