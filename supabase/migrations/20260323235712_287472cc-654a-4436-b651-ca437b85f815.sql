
-- 1. Create get_user_id_by_email RPC (admin-only, security definer)
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(_email text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _found_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: only admins can look up users';
  END IF;

  SELECT id INTO _found_id
  FROM auth.users
  WHERE email = _email
  LIMIT 1;

  IF _found_id IS NULL THEN
    RAISE EXCEPTION 'No user found with that email';
  END IF;

  RETURN _found_id;
END;
$$;

-- 2. Update grant_role with owner-only admin check
CREATE OR REPLACE FUNCTION public.grant_role(_target_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _owner_id uuid := 'fcf7e150-d122-47e0-b30e-359668184d85';
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: only admins can grant roles';
  END IF;

  -- Only the owner can grant or revoke admin role
  IF _role = 'admin' AND auth.uid() != _owner_id THEN
    RAISE EXCEPTION 'Only the app owner can grant admin roles';
  END IF;

  -- Cannot grant admin role to self
  IF _target_user_id = auth.uid() AND _role = 'admin' THEN
    RAISE EXCEPTION 'Cannot grant admin role to yourself';
  END IF;

  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (_target_user_id, _role, auth.uid())
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- 3. Update revoke_role with owner-only admin check
CREATE OR REPLACE FUNCTION public.revoke_role(_target_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _owner_id uuid := 'fcf7e150-d122-47e0-b30e-359668184d85';
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: only admins can revoke roles';
  END IF;

  -- Only the owner can grant or revoke admin role
  IF _role = 'admin' AND auth.uid() != _owner_id THEN
    RAISE EXCEPTION 'Only the app owner can revoke admin roles';
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = _target_user_id AND role = _role;
END;
$$;

-- 4. Allow admins to view all roles (for the admin tools list)
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));
