
-- Create daily_challenges table for rotating micro-goals
CREATE TABLE public.daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_type text NOT NULL,
  target_value integer NOT NULL DEFAULT 1,
  current_progress integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  xp_reward integer NOT NULL DEFAULT 15,
  challenge_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_date)
);

-- Enable RLS
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own daily challenges"
ON public.daily_challenges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily challenges"
ON public.daily_challenges FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily challenges"
ON public.daily_challenges FOR UPDATE
USING (auth.uid() = user_id);

-- Add streak_recovered_at column for 24h reclaim window
ALTER TABLE public.user_learning_stats
ADD COLUMN streak_recovered_at timestamptz DEFAULT NULL;
