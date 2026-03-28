
-- Add churn tracking columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS churn_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_winback_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS winback_attempts integer NOT NULL DEFAULT 0;

-- Create index for churn detection queries
CREATE INDEX IF NOT EXISTS idx_profiles_churn_detection 
  ON public.profiles (last_active_at, churn_status) 
  WHERE onboarding_completed = true;
