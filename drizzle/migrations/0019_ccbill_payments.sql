-- CCBill payments (replaces Stripe). November 2026.
-- Safe to run more than once. Nothing here charges anyone: checkout stays closed until the
-- CCBILL_* secrets exist and PAYMENTS_OPEN is switched on in src/lib/payments.ts.

-- 1. Subscriptions: CCBill id, billing period, and cancellation state.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS ccbill_subscription_id text,
  ADD COLUMN IF NOT EXISTS billing_period text,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'ccbill';

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_ccbill_subscription_id_key
  ON public.subscriptions (ccbill_subscription_id) WHERE ccbill_subscription_id IS NOT NULL;

DO $$ BEGIN
  ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_source_check
    CHECK (source IN ('ccbill', 'promo', 'referral', 'comp', 'stripe_legacy'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- The two existing active rows were set up by hand, not bought.
UPDATE public.subscriptions SET source = 'comp'
  WHERE ccbill_subscription_id IS NULL AND stripe_subscription_id IS NULL AND source = 'ccbill';

-- 2. One row per webhook CCBill sends, so a retried webhook is applied only once.
--    Only non-sensitive fields are stored (no names, addresses or card details).
CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL UNIQUE,
  event_type text NOT NULL,
  ccbill_subscription_id text,
  user_id uuid,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  outcome text,
  error text,
  received_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read payment events" ON public.payment_events;
CREATE POLICY "Admins read payment events" ON public.payment_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS payment_events_subscription_idx ON public.payment_events (ccbill_subscription_id);

-- 3. One-time purchases (Profile Boost, Thot Packs, coins, event tickets), so refunds and
--    chargebacks can find what to take back.
CREATE TABLE IF NOT EXISTS public.payment_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_key text NOT NULL,
  reference_id text,
  ccbill_subscription_id text NOT NULL UNIQUE,
  transaction_id text,
  amount numeric(10, 2),
  status text NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'refund', 'chargeback', 'void', 'return')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members read own purchases" ON public.payment_purchases;
CREATE POLICY "Members read own purchases" ON public.payment_purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins read all purchases" ON public.payment_purchases;
CREATE POLICY "Admins read all purchases" ON public.payment_purchases
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS payment_purchases_user_idx ON public.payment_purchases (user_id);

-- Writes to all three tables come only from the ccbill-webhook, cancel-subscription and
-- redeem-promo-code functions, which use the service role. Members never write here.
