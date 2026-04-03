
CREATE TABLE public.external_platform_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform text NOT NULL DEFAULT 'fetlife',
  platform_username text NOT NULL,
  verification_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  linked_at timestamptz DEFAULT now(),
  verified_at timestamptz,
  UNIQUE(user_id, platform)
);

-- Create validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_external_platform_link_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'self_reported', 'verified', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_external_platform_link_status_trigger
  BEFORE INSERT OR UPDATE ON public.external_platform_links
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_external_platform_link_status();

ALTER TABLE public.external_platform_links ENABLE ROW LEVEL SECURITY;

-- Users can manage their own links
CREATE POLICY "Users can manage own external links"
  ON public.external_platform_links
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anyone authenticated can view links (for badge display)
CREATE POLICY "Authenticated users can view external links"
  ON public.external_platform_links
  FOR SELECT
  TO authenticated
  USING (status IN ('self_reported', 'verified'));
