
-- Fix: Restrict profiles SELECT to own-row only. 
-- Cross-user reads use get_discovery_profiles / get_public_profile RPCs.
DROP POLICY IF EXISTS "Authenticated users can view public profile fields" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);
