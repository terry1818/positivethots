

## Deploy Edge Functions

All four Stripe-related edge functions need to be deployed to production. They already exist in the codebase and are configured in `supabase/config.toml` with `verify_jwt = false`.

### What will be deployed

| Function | Purpose |
|----------|---------|
| `stripe-webhook` | Receives Stripe events and syncs subscription status to the database |
| `create-checkout` | Creates Stripe checkout sessions for premium subscriptions |
| `check-subscription` | Verifies a user's active subscription status via Stripe |
| `customer-portal` | Generates Stripe billing portal sessions for subscription management |

### Steps

1. Deploy all four functions using the deployment tool in a single action
2. Verify deployment succeeded (check for any errors)

### Prerequisites (already met)
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` secrets are configured
- All function files exist under `supabase/functions/`
- `config.toml` has all four functions listed with `verify_jwt = false`

No code changes are needed — this is purely a deployment operation.

