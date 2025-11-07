-- Add additional profile fields for onboarding
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS gender_preference text,
ADD COLUMN IF NOT EXISTS interests text[],
ADD COLUMN IF NOT EXISTS looking_for text,
ADD COLUMN IF NOT EXISTS photos text[],
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Update existing profiles to have default values
UPDATE public.profiles 
SET onboarding_completed = true 
WHERE onboarding_completed IS NULL;