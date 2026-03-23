
-- Block any authenticated user from inserting into user_roles directly
-- Only service_role (used by grant_role RPC) can insert
CREATE POLICY "Only service role can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Also block direct updates
CREATE POLICY "Only service role can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false);

-- Also block direct deletes (revoke_role RPC uses SECURITY DEFINER)
CREATE POLICY "Only service role can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (false);
