ALTER TABLE public.promo_codes ADD CONSTRAINT trial_days_range CHECK (trial_days BETWEEN 1 AND 90);
ALTER TABLE public.promo_codes ADD CONSTRAINT type_valid CHECK (type IN ('gift', 'referral'));
ALTER TABLE public.promo_codes ADD CONSTRAINT tier_valid CHECK (tier IS NULL OR tier IN ('plus', 'premium', 'vip'));