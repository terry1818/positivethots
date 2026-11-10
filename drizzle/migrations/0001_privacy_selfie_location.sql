ALTER TABLE public.verification_requests ALTER COLUMN selfie_path DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.round_user_location()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.latitude := round(NEW.latitude::numeric, 2);
  NEW.longitude := round(NEW.longitude::numeric, 2);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS round_user_location_trigger ON public.user_locations;
CREATE TRIGGER round_user_location_trigger BEFORE INSERT OR UPDATE ON public.user_locations
FOR EACH ROW EXECUTE FUNCTION public.round_user_location();

UPDATE public.user_locations SET latitude = round(latitude::numeric, 2), longitude = round(longitude::numeric, 2);

GRANT DELETE ON public.user_locations TO authenticated;
DROP POLICY IF EXISTS "Users can delete own location" ON public.user_locations;
CREATE POLICY "Users can delete own location" ON public.user_locations
FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.purge_old_verification_selfies()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, storage AS $$
DECLARE _paths text[]; _count integer := 0;
BEGIN
  SELECT coalesce(array_agg(name), '{}') INTO _paths FROM storage.objects
  WHERE bucket_id = 'verification-selfies' AND created_at < now() - interval '24 hours';

  PERFORM set_config('storage.allow_delete_query', 'true', true);
  DELETE FROM storage.objects WHERE bucket_id = 'verification-selfies' AND name = ANY(_paths);
  GET DIAGNOSTICS _count = ROW_COUNT;

  UPDATE public.verification_requests SET selfie_path = NULL WHERE selfie_path = ANY(_paths);
  UPDATE public.face_verifications SET selfie_url = NULL WHERE selfie_url = ANY(_paths);
  UPDATE public.verification_requests SET selfie_path = NULL
    WHERE selfie_path IS NOT NULL AND created_at < now() - interval '24 hours';
  UPDATE public.face_verifications SET selfie_url = NULL
    WHERE selfie_url IS NOT NULL AND created_at < now() - interval '24 hours';

  DELETE FROM public.user_locations WHERE expires_at < now();

  INSERT INTO public.audit_log (admin_user_id, action, details)
  VALUES ('00000000-0000-0000-0000-000000000000', 'purge_old_verification_selfies', jsonb_build_object('files_removed', _count));
  RETURN _count;
END; $$;

REVOKE EXECUTE ON FUNCTION public.purge_old_verification_selfies() FROM PUBLIC, anon, authenticated;