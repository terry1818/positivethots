
CREATE TABLE public.nps_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 10),
  feedback text,
  trigger_event text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own NPS responses"
  ON public.nps_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own NPS responses"
  ON public.nps_responses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all NPS responses"
  ON public.nps_responses FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_nps_responses_user_id ON public.nps_responses (user_id);
CREATE INDEX idx_nps_responses_trigger ON public.nps_responses (user_id, trigger_event);
