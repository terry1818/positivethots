
-- 1. Audit log table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  target_user_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit log" ON public.audit_log FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert audit log" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()) AND admin_user_id = auth.uid());
CREATE INDEX idx_audit_log_created ON public.audit_log (created_at DESC);

-- 2. Announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  target_audience text NOT NULL DEFAULT 'all',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Users can view active announcements" ON public.announcements FOR SELECT TO authenticated USING (is_active = true);

-- 3. Trigger: auto-grant premium when admin role is inserted
CREATE OR REPLACE FUNCTION public.grant_admin_premium()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    INSERT INTO public.subscriptions (user_id, status, plan, current_period_end, created_at, updated_at)
    VALUES (NEW.user_id, 'active', 'vip', NULL, now(), now())
    ON CONFLICT ON CONSTRAINT subscriptions_user_id_key DO UPDATE
    SET status = 'active', plan = 'vip', current_period_end = NULL, updated_at = now()
    WHERE subscriptions.user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Check if unique constraint exists on subscriptions.user_id, add if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_user_id_key'
  ) THEN
    -- Add unique constraint if it doesn't exist
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
  END IF;
END
$$;

CREATE TRIGGER on_admin_role_granted
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.grant_admin_premium();

-- 4. Admin dashboard stats RPC
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result jsonb;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT jsonb_build_object(
    'total_users', (SELECT count(*) FROM profiles),
    'new_users_7d', (SELECT count(*) FROM profiles WHERE created_at >= now() - interval '7 days'),
    'new_users_30d', (SELECT count(*) FROM profiles WHERE created_at >= now() - interval '30 days'),
    'total_matches', (SELECT count(*) FROM matches),
    'total_messages', (SELECT count(*) FROM messages),
    'active_subscribers', (SELECT count(*) FROM subscriptions WHERE status = 'active' AND (current_period_end IS NULL OR current_period_end > now())),
    'dau', (SELECT count(DISTINCT id) FROM profiles WHERE last_active_at >= now() - interval '1 day'),
    'wau', (SELECT count(DISTINCT id) FROM profiles WHERE last_active_at >= now() - interval '7 days'),
    'prev_total_users', (SELECT count(*) FROM profiles WHERE created_at < now() - interval '7 days'),
    'prev_matches_7d', (SELECT count(*) FROM matches WHERE created_at >= now() - interval '14 days' AND created_at < now() - interval '7 days'),
    'prev_messages_7d', (SELECT count(*) FROM messages WHERE created_at >= now() - interval '14 days' AND created_at < now() - interval '7 days'),
    'matches_7d', (SELECT count(*) FROM matches WHERE created_at >= now() - interval '7 days'),
    'messages_7d', (SELECT count(*) FROM messages WHERE created_at >= now() - interval '7 days'),
    'open_reports', (SELECT count(*) FROM reports WHERE status = 'pending')
  ) INTO _result;

  RETURN _result;
END;
$$;

-- 5. Admin user list RPC with pagination and search
CREATE OR REPLACE FUNCTION public.get_admin_user_list(
  _search text DEFAULT '',
  _filter text DEFAULT 'all',
  _page integer DEFAULT 1,
  _per_page integer DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result jsonb;
  _total bigint;
  _offset integer;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  _offset := (_page - 1) * _per_page;

  -- Get total count
  SELECT count(*) INTO _total
  FROM profiles p
  WHERE (_search = '' OR p.name ILIKE '%' || _search || '%' OR p.display_name ILIKE '%' || _search || '%')
    AND (
      _filter = 'all'
      OR (_filter = 'admin' AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role = 'admin'))
      OR (_filter = 'premium' AND EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = p.id AND s.status = 'active'))
      OR (_filter = 'verified' AND p.is_verified = true)
      OR (_filter = 'new' AND p.created_at >= now() - interval '7 days')
    );

  SELECT jsonb_build_object(
    'total', _total,
    'page', _page,
    'per_page', _per_page,
    'users', COALESCE((
      SELECT jsonb_agg(row_to_json(sub.*) ORDER BY sub.created_at DESC)
      FROM (
        SELECT
          p.id, p.name, p.display_name, p.profile_image, p.created_at,
          p.last_active_at, p.is_verified, p.onboarding_completed,
          EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role = 'admin') AS is_admin,
          EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = p.id AND s.status = 'active' AND (s.current_period_end IS NULL OR s.current_period_end > now())) AS is_premium,
          (SELECT s.plan FROM subscriptions s WHERE s.user_id = p.id AND s.status = 'active' LIMIT 1) AS plan
        FROM profiles p
        WHERE (_search = '' OR p.name ILIKE '%' || _search || '%' OR p.display_name ILIKE '%' || _search || '%')
          AND (
            _filter = 'all'
            OR (_filter = 'admin' AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role = 'admin'))
            OR (_filter = 'premium' AND EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = p.id AND s.status = 'active'))
            OR (_filter = 'verified' AND p.is_verified = true)
            OR (_filter = 'new' AND p.created_at >= now() - interval '7 days')
          )
        ORDER BY p.created_at DESC
        LIMIT _per_page OFFSET _offset
      ) sub
    ), '[]'::jsonb)
  ) INTO _result;

  RETURN _result;
END;
$$;

-- 6. Admin action: suspend/unsuspend user
CREATE OR REPLACE FUNCTION public.admin_suspend_user(_target_user_id uuid, _suspend boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Log the action
  INSERT INTO public.audit_log (admin_user_id, action, target_user_id, details)
  VALUES (auth.uid(), CASE WHEN _suspend THEN 'suspend_user' ELSE 'unsuspend_user' END, _target_user_id, jsonb_build_object('suspended', _suspend));

  -- Update profile churn_status as suspension marker
  UPDATE public.profiles
  SET churn_status = CASE WHEN _suspend THEN 'suspended' ELSE 'active' END,
      updated_at = now()
  WHERE id = _target_user_id;
END;
$$;
