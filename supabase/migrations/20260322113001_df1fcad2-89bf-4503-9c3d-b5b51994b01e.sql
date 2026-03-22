
-- Create user_locations table
CREATE TABLE public.user_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  is_sharing boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '2 hours')
);

-- Enable RLS
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Users can read their own row
CREATE POLICY "Users can view own location"
  ON public.user_locations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can upsert their own row
CREATE POLICY "Users can upsert own location"
  ON public.user_locations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own location"
  ON public.user_locations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can see other sharing users (not expired)
CREATE POLICY "Users can view active sharing locations"
  ON public.user_locations FOR SELECT
  TO authenticated
  USING (is_sharing = true AND expires_at > now());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;
