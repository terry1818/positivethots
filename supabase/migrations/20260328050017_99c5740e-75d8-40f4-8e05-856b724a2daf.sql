
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mystery_reveals_today integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mystery_reveals_date date;
