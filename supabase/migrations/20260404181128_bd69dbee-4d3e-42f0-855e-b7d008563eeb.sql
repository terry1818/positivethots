
-- Spotify connections table
CREATE TABLE IF NOT EXISTS public.spotify_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spotify_user_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  top_artists JSONB DEFAULT '[]'::jsonb,
  top_tracks JSONB DEFAULT '[]'::jsonb,
  anthem_track JSONB,
  show_on_profile BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.spotify_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own spotify" ON public.spotify_connections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public spotify visible" ON public.spotify_connections
  FOR SELECT USING (show_on_profile = true);

-- Video date events
CREATE TABLE IF NOT EXISTS public.video_date_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Speed Dating Night',
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  round_duration_seconds INTEGER NOT NULL DEFAULT 300,
  max_participants INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  education_tier_required INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.video_date_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can see video events" ON public.video_date_events
  FOR SELECT USING (true);

CREATE POLICY "Admins manage video events" ON public.video_date_events
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Video date participants
CREATE TABLE IF NOT EXISTS public.video_date_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.video_date_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered'
    CHECK (status IN ('registered', 'checked_in', 'active', 'completed', 'no_show')),
  matches_found INTEGER NOT NULL DEFAULT 0,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.video_date_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can see participants" ON public.video_date_participants
  FOR SELECT USING (true);

CREATE POLICY "Users register themselves" ON public.video_date_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own participation" ON public.video_date_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Video date rounds
CREATE TABLE IF NOT EXISTS public.video_date_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.video_date_events(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  user_a UUID NOT NULL REFERENCES auth.users(id),
  user_b UUID NOT NULL REFERENCES auth.users(id),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  user_a_interest BOOLEAN,
  user_b_interest BOOLEAN,
  is_match BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.video_date_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own rounds" ON public.video_date_rounds
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Users update own interest" ON public.video_date_rounds
  FOR UPDATE USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_spotify_user ON public.spotify_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_video_events_status ON public.video_date_events(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_video_participants_event ON public.video_date_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_video_participants_user ON public.video_date_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_video_rounds_event ON public.video_date_rounds(event_id, round_number);

-- Add cross_app_links to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cross_app_links JSONB DEFAULT '[]'::jsonb;
