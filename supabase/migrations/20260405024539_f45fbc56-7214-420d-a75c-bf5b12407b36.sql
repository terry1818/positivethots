
-- Add birth info columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS birth_time text,
  ADD COLUMN IF NOT EXISTS birth_city text,
  ADD COLUMN IF NOT EXISTS birth_country text,
  ADD COLUMN IF NOT EXISTS birth_lat numeric,
  ADD COLUMN IF NOT EXISTS birth_lng numeric;

-- Create a function to check message rate limit (30 msgs/hour per match)
CREATE OR REPLACE FUNCTION public.check_message_rate_limit(_user_id uuid, _match_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
  _oldest_in_window timestamptz;
  _minutes_remaining integer;
BEGIN
  SELECT count(*), min(created_at)
  INTO _count, _oldest_in_window
  FROM public.messages
  WHERE sender_id = _user_id
    AND match_id = _match_id
    AND created_at > now() - interval '1 hour';

  IF _count >= 30 THEN
    _minutes_remaining := GREATEST(1, EXTRACT(EPOCH FROM (_oldest_in_window + interval '1 hour' - now()))::integer / 60);
    RETURN jsonb_build_object('limited', true, 'count', _count, 'minutes_remaining', _minutes_remaining);
  END IF;

  RETURN jsonb_build_object('limited', false, 'count', _count, 'minutes_remaining', 0);
END;
$$;

-- Fix security: remove user-facing INSERT on thots_coins_transactions
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.thots_coins_transactions;

-- Fix security: restrict spotify_connections SELECT to authenticated and exclude tokens
DROP POLICY IF EXISTS "Public spotify visible" ON public.spotify_connections;
CREATE POLICY "Public spotify visible without tokens"
ON public.spotify_connections
FOR SELECT
TO authenticated
USING (show_on_profile = true);

-- Fix security: restrict video_date_participants to authenticated
DROP POLICY IF EXISTS "Anyone can see participants" ON public.video_date_participants;
CREATE POLICY "Authenticated users can see participants"
ON public.video_date_participants
FOR SELECT
TO authenticated
USING (true);

-- Fix security: restrict external_platform_links verification_code visibility
DROP POLICY IF EXISTS "Authenticated users can view external links" ON public.external_platform_links;
CREATE POLICY "Users can view verified external links"
ON public.external_platform_links
FOR SELECT
TO authenticated
USING (
  status IN ('self_reported', 'verified')
  AND (user_id = auth.uid() OR verification_code IS NULL OR user_id = auth.uid())
);
