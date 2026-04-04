
-- Thots Coins Store (items purchasable with coins)
CREATE TABLE IF NOT EXISTS public.thots_coins_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL CHECK (item_type IN (
    'send_thot', 'boost', 'read_receipt', 'undo_pass', 'spotlight',
    'gift_badge', 'custom_theme', 'priority_match', 'extended_video', 'constellation_glow'
  )),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  coin_cost INTEGER NOT NULL,
  icon TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.thots_coins_store ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read store" ON public.thots_coins_store FOR SELECT USING (is_active = true);

CREATE INDEX idx_coins_store_type ON public.thots_coins_store(item_type);

-- Thots Coins Transactions
CREATE TABLE IF NOT EXISTS public.thots_coins_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'purchase', 'earned_quiz', 'earned_badge', 'earned_streak', 'earned_sprint',
    'earned_daily', 'earned_referral', 'spent', 'gifted_sent', 'gifted_received',
    'refund', 'admin'
  )),
  description TEXT NOT NULL,
  reference_id UUID,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.thots_coins_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own transactions" ON public.thots_coins_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own transactions" ON public.thots_coins_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_coins_transactions_user ON public.thots_coins_transactions(user_id, created_at DESC);

-- Add coins balance to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS thots_coins_balance INTEGER NOT NULL DEFAULT 0;

-- Coin Packages (real-money purchase options)
CREATE TABLE IF NOT EXISTS public.coin_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  coins INTEGER NOT NULL,
  bonus_coins INTEGER NOT NULL DEFAULT 0,
  price_usd DECIMAL(10,2) NOT NULL,
  stripe_price_id TEXT,
  apple_product_id TEXT,
  google_product_id TEXT,
  is_best_value BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coin_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read packages" ON public.coin_packages FOR SELECT USING (is_active = true);

-- Group Subscriptions
CREATE TABLE IF NOT EXISTS public.group_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  member_count INTEGER NOT NULL CHECK (member_count BETWEEN 2 AND 5),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'premium', 'vip')),
  monthly_price_usd DECIMAL(10,2) NOT NULL,
  annual_price_usd DECIMAL(10,2) NOT NULL,
  individual_monthly_total DECIMAL(10,2) NOT NULL,
  savings_percentage INTEGER NOT NULL,
  stripe_monthly_price_id TEXT,
  stripe_annual_price_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.group_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads group subs" ON public.group_subscriptions FOR SELECT USING (is_active = true);

-- Group Subscription Members
CREATE TABLE IF NOT EXISTS public.group_subscription_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.group_subscriptions(id),
  group_owner_id UUID NOT NULL,
  member_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'removed')),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(subscription_id, member_id)
);

ALTER TABLE public.group_subscription_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see own group sub" ON public.group_subscription_members FOR SELECT
  USING (auth.uid() = group_owner_id OR auth.uid() = member_id);
CREATE POLICY "Owners manage group sub" ON public.group_subscription_members FOR INSERT
  WITH CHECK (auth.uid() = group_owner_id);
CREATE POLICY "Owners update group sub" ON public.group_subscription_members FOR UPDATE
  USING (auth.uid() = group_owner_id);
CREATE POLICY "Owners delete group sub" ON public.group_subscription_members FOR DELETE
  USING (auth.uid() = group_owner_id);

-- Pricing Tiers (dynamic/personalized)
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_segment TEXT NOT NULL CHECK (user_segment IN (
    'new_user', 'active_free', 'lapsed', 'power_user',
    'social_user', 'education_focused', 'trial_expired'
  )),
  recommended_plan TEXT NOT NULL CHECK (recommended_plan IN ('basic', 'premium', 'vip')),
  trial_offer_days INTEGER DEFAULT 0,
  discount_percentage INTEGER DEFAULT 0,
  promo_message TEXT,
  trigger_event TEXT CHECK (trigger_event IN ('app_open', 'paywall_hit', 'feature_locked', 'streak_milestone')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads pricing" ON public.pricing_tiers FOR SELECT USING (is_active = true);

-- Atomic coin debit function
CREATE OR REPLACE FUNCTION public.debit_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT,
  p_description TEXT,
  p_reference_id UUID DEFAULT NULL
)
RETURNS TABLE(balance_after INTEGER) AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE public.profiles
  SET thots_coins_balance = thots_coins_balance - p_amount
  WHERE id = p_user_id AND thots_coins_balance >= p_amount
  RETURNING thots_coins_balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient coins or user not found';
  END IF;

  INSERT INTO public.thots_coins_transactions
    (user_id, amount, transaction_type, description, reference_id, balance_after)
  VALUES
    (p_user_id, -p_amount, p_transaction_type, p_description, p_reference_id, v_new_balance);

  RETURN QUERY SELECT v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Credit coins function
CREATE OR REPLACE FUNCTION public.credit_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT,
  p_description TEXT,
  p_reference_id UUID DEFAULT NULL
)
RETURNS TABLE(balance_after INTEGER) AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE public.profiles
  SET thots_coins_balance = thots_coins_balance + p_amount
  WHERE id = p_user_id
  RETURNING thots_coins_balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO public.thots_coins_transactions
    (user_id, amount, transaction_type, description, reference_id, balance_after)
  VALUES
    (p_user_id, p_amount, p_transaction_type, p_description, p_reference_id, v_new_balance);

  RETURN QUERY SELECT v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
