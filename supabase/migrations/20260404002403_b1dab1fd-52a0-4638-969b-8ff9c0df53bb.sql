
-- Add event tier classification
ALTER TABLE public.events
  ADD COLUMN event_tier text NOT NULL DEFAULT 'community';

-- Add event_tier validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_event_tier()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.event_tier NOT IN ('community', 'premium', 'adults_only') THEN
    RAISE EXCEPTION 'Invalid event_tier: %', NEW.event_tier;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_event_tier_trigger
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.validate_event_tier();

-- Add event_tier index for filtered queries
CREATE INDEX idx_events_tier ON public.events (event_tier);

-- Add optional fields for richer event cards
ALTER TABLE public.events
  ADD COLUMN event_format text DEFAULT 'in_person',
  ADD COLUMN location_name text,
  ADD COLUMN location_address text,
  ADD COLUMN max_waitlist integer DEFAULT 0,
  ADD COLUMN requires_application boolean DEFAULT false,
  ADD COLUMN age_minimum integer DEFAULT 18;

-- Validate event_format
CREATE OR REPLACE FUNCTION public.validate_event_format()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.event_format IS NOT NULL AND NEW.event_format NOT IN ('in_person', 'virtual', 'hybrid') THEN
    RAISE EXCEPTION 'Invalid event_format: %', NEW.event_format;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_event_format_trigger
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.validate_event_format();

-- Create RSVP table for free community events
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

-- Validate RSVP status
CREATE OR REPLACE FUNCTION public.validate_rsvp_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('confirmed', 'waitlisted', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid RSVP status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_rsvp_status_trigger
BEFORE INSERT OR UPDATE ON public.event_rsvps
FOR EACH ROW EXECUTE FUNCTION public.validate_rsvp_status();

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own RSVPs" ON public.event_rsvps
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can RSVP" ON public.event_rsvps
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel own RSVP" ON public.event_rsvps
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own RSVP" ON public.event_rsvps
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
