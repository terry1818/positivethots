
-- Fix the external_platform_links policy - the previous one had a logic error
DROP POLICY IF EXISTS "Users can view verified external links" ON public.external_platform_links;

-- Create a view-based approach: all authenticated users can see verified/self_reported links
-- but we need a separate policy for owners to see their own pending links
CREATE POLICY "Users can view public external links"
ON public.external_platform_links
FOR SELECT
TO authenticated
USING (
  (status IN ('self_reported', 'verified'))
  OR (user_id = auth.uid())
);
