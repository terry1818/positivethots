
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS learning_level integer DEFAULT 1;

ALTER TABLE public.user_learning_stats ADD COLUMN IF NOT EXISTS boost_credits integer DEFAULT 0;
