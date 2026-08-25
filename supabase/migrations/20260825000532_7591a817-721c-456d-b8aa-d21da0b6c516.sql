-- 1. Drop unused quiz answer validation function (allowed answer brute-forcing)
DROP FUNCTION IF EXISTS public.validate_quiz_answer(uuid, integer);

-- 2. Lock down SECURITY DEFINER functions: no anonymous execution; internal helpers not callable by users
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', f.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', f.sig);
  END LOOP;
END $$;

-- Internal / trigger / queue-only helpers: not callable by signed-in users either
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND p.proname IN (
        'update_updated_at','notify_match_trigger','check_max_partner_links',
        'email_queue_dispatch','email_queue_wake','enqueue_email','read_email_batch',
        'delete_email','move_to_dlq','award_badge','track_photo_engagement',
        'grant_admin_premium','award_xp','credit_coins','debit_coins'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', f.sig);
  END LOOP;
END $$;

-- award_xp / credit_coins / debit_coins are called from the client, keep those callable
GRANT EXECUTE ON FUNCTION public.award_xp(uuid, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.credit_coins(uuid, integer, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debit_coins(uuid, integer, text, text, uuid) TO authenticated;

-- 3. external_platform_links: hide verification codes from other users
REVOKE SELECT (verification_code) ON public.external_platform_links FROM authenticated, anon;
REVOKE UPDATE (verification_code) ON public.external_platform_links FROM authenticated, anon;

CREATE OR REPLACE FUNCTION public.get_my_verification_code(_platform text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT verification_code
  FROM public.external_platform_links
  WHERE user_id = auth.uid() AND platform = _platform
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_my_verification_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_verification_code(text) TO authenticated;

-- 4. spotify_connections: never expose OAuth tokens to clients
REVOKE SELECT (access_token, refresh_token) ON public.spotify_connections FROM authenticated, anon;
REVOKE UPDATE (access_token, refresh_token) ON public.spotify_connections FROM authenticated, anon;

-- 5. video_date_participants: only visible to co-participants of the same event
CREATE OR REPLACE FUNCTION public.is_video_date_participant(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.video_date_participants
    WHERE event_id = _event_id AND user_id = _user_id
  )
$$;
REVOKE ALL ON FUNCTION public.is_video_date_participant(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_video_date_participant(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can see participants" ON public.video_date_participants;
CREATE POLICY "Participants can see co-participants"
ON public.video_date_participants FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_video_date_participant(event_id, auth.uid()));

-- 6. Storage: profile-images write policies were open to everyone
DROP POLICY IF EXISTS "Service role can manage profile images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update profile images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload profile images" ON storage.objects;

CREATE POLICY "Service role manages profile images"
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'profile-images') WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profile-images' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'profile-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profile-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 7. Storage: tts-audio uploads restricted to backend
DROP POLICY IF EXISTS "Service role can upload TTS audio" ON storage.objects;
CREATE POLICY "Service role can upload TTS audio"
ON storage.objects FOR INSERT TO service_role
WITH CHECK (bucket_id = 'tts-audio');