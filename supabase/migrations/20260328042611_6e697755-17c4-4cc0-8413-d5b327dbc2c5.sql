
-- Add ENM experience level column to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS enm_experience_level text DEFAULT 'beginner';
