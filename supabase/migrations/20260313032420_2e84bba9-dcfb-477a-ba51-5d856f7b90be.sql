ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sexuality text,
  ADD COLUMN IF NOT EXISTS desires text[],
  ADD COLUMN IF NOT EXISTS height_cm integer,
  ADD COLUMN IF NOT EXISTS zodiac_sign text,
  ADD COLUMN IF NOT EXISTS languages text[],
  ADD COLUMN IF NOT EXISTS lifestyle jsonb,
  ADD COLUMN IF NOT EXISTS display_name text;