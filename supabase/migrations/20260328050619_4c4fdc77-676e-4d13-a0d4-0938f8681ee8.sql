
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selected_frame text NOT NULL DEFAULT 'newbie';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS earned_frames text[] NOT NULL DEFAULT '{newbie}'::text[];
