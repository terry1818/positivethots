CREATE OR REPLACE FUNCTION public.is_sprint_member(_sprint_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sprint_participants AS membership
    WHERE membership.sprint_id = _sprint_id
      AND membership.user_id = (SELECT auth.uid())
  );
$$;
REVOKE ALL ON FUNCTION public.is_sprint_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_sprint_member(uuid) TO authenticated, service_role;
ALTER POLICY "Anyone can see sprint participants"
ON public.sprint_participants
TO authenticated
USING (user_id = (SELECT auth.uid()) OR public.is_sprint_member(sprint_id));