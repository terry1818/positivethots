# CCBill go-live checklist

Built Nov 27, 2026. Everything below the line "Already done" is waiting on CCBill approving the
merchant account. Until then `PAYMENTS_OPEN` is `false`, no screen offers a checkout, and the CCBill
functions refuse to run (503 `payments_not_configured`).

## Already done (in the repo and deployed)

| Piece | Where | What it does |
|---|---|---|
| Checkout | `supabase/functions/ccbill-checkout` | Signs a FlexForm link (dynamic pricing, MD5 `formDigest`) for a plan, Boost, Thot Pack, coin package or event ticket. Prices come from the server, never the app. |
| Webhook | `supabase/functions/ccbill-webhook` | The only place access is granted or removed. Checks a secret token and CCBill's IP blocks, records each event once in `payment_events`, then activates, renews, cancels, expires or reverses. |
| One-tap cancel | `supabase/functions/cancel-subscription` + Settings | Calls CCBill DataLink to stop renewals, emails a confirmation, keeps access to the period end. If DataLink fails, it still records the cancel and writes `MANUAL CANCEL NEEDED` to `error_logs`. |
| Plan status | `supabase/functions/check-subscription` | Reads the `subscriptions` table. |
| Promo and gift codes | `supabase/functions/redeem-promo-code` | Grants free time directly. No card, no checkout. |
| Renewal consent | `src/pages/Premium.tsx` | Auto-renewal terms plus a required checkbox before any plan checkout (ROSCA, California ARL). |
| Shared logic and tests | `supabase/functions/_shared/ccbill-core.ts`, `tests/ccbill.test.ts` | Digest formulas are checked against CCBill's published examples. |

Stripe functions removed: create-checkout, create-boost-payment, create-superlike-payment,
create-event-checkout, stripe-webhook, customer-portal.

## Ask Kevin (CCBill) when the account is approved

1. Turn on **Dynamic Pricing** for the subaccount, and allow a **365-day recurring period** for the yearly plans. CCBill's defaults are 30, 60 and 90 days.
2. Turn on **DataLink**, and tell us which IP addresses must be approved. Our server's address can change, so ask whether they can allow cancels without an IP list. If they can't, the cancel still works on our side and shows up as `MANUAL CANCEL NEEDED` for a same-day manual cancel.
3. Confirm webhooks may be sent as **JSON**.

## In the CCBill Admin Portal

1. **Create a FlexForm** with Positive Thots branding. Set the approval URL to `https://positivethots.app/premium?success=true` and the denial URL to `https://positivethots.app/premium?failed=true`. Copy the **FlexForm ID**.
2. **Copy the Salt** (encryption key): Account Info > Sub Account Admin > Advanced.
3. **Create a DataLink user** and save its username and password.
4. **Add the webhook URL** (Account Info > Sub Account Admin > Webhooks), with format **JSON** and every subscription event ticked:
   `https://<project-ref>.supabase.co/functions/v1/ccbill-webhook?token=<a long random string>`

## Secrets to add in Lovable (Cloud > Secrets)

| Secret | Value |
|---|---|
| `CCBILL_CLIENT_ACCNUM` | 6-digit account number |
| `CCBILL_SUBACC` | 4-digit subaccount |
| `CCBILL_FLEXFORM_ID` | the FlexForm ID |
| `CCBILL_SALT` | the Salt |
| `CCBILL_DATALINK_USER` / `CCBILL_DATALINK_PASS` | the DataLink login |
| `CCBILL_WEBHOOK_TOKEN` | the same long random string as in the webhook URL |

## Switch on

1. Make one real purchase of the cheapest item (Thot Pack 5, $1.99) on a test account. Check that `payment_events` shows `NewSaleSuccess` with outcome `thot pack 5 added`, then refund it in CCBill and check that a `Refund` row reverses it.
2. Buy Plus monthly, cancel it in Settings, and confirm `cancel_at_period_end` is true and the email arrived.
3. Set `PAYMENTS_OPEN = true` in `src/lib/payments.ts`, push, and Publish in Lovable.
