
-- Create user_learning_stats table
CREATE TABLE public.user_learning_stats (
  user_id UUID NOT NULL PRIMARY KEY,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  streak_freeze_available BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_learning_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own learning stats"
ON public.user_learning_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning stats"
ON public.user_learning_stats FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning stats"
ON public.user_learning_stats FOR UPDATE
USING (auth.uid() = user_id);

-- Create xp_transactions table
CREATE TABLE public.xp_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  xp_amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own xp transactions"
ON public.xp_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own xp transactions"
ON public.xp_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at on learning stats
CREATE TRIGGER update_user_learning_stats_updated_at
BEFORE UPDATE ON public.user_learning_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
