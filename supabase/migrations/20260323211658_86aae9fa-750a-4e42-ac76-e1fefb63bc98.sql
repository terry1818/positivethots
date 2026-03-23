
-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('gift', 'referral')),
  tier text CHECK (tier IN ('plus', 'premium', 'vip')),
  trial_days integer NOT NULL DEFAULT 14,
  created_by uuid NOT NULL,
  redeemed_by uuid,
  redeemed_at timestamptz,
  referred_subscribed boolean NOT NULL DEFAULT false,
  reward_granted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Authenticated users can create codes
CREATE POLICY "Users can insert own codes"
ON public.promo_codes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Users can see codes they created or redeemed
CREATE POLICY "Users can view own codes"
ON public.promo_codes FOR SELECT TO authenticated
USING (auth.uid() = created_by OR auth.uid() = redeemed_by);
