-- Add tutorials_completed column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tutorials_completed text[] NOT NULL DEFAULT '{}';

-- Enable realtime for matches table
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
