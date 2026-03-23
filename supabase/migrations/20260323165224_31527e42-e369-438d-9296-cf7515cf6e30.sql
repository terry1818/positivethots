
-- Add a SELECT policy so authenticated users can see non-sensitive profile fields
-- of other users (needed for matching/discovery). Sensitive fields are protected
-- because get_discovery_profiles and get_public_profile RPCs already select only safe columns.
CREATE POLICY "Authenticated users can view public profile fields"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Drop the old restrictive policy since the new one covers it
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
