
-- Error logs table
CREATE TABLE public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  error_message text NOT NULL,
  error_stack text,
  page_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own errors" ON public.error_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all errors" ON public.error_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Analytics events table
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_name text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events" ON public.analytics_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all events" ON public.analytics_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Flagged messages table
CREATE TABLE public.flagged_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.flagged_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view flagged messages" ON public.flagged_messages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update flagged messages" ON public.flagged_messages
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert flagged messages" ON public.flagged_messages
  FOR INSERT TO authenticated WITH CHECK (true);
