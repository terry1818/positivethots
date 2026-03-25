-- Create a trigger function to call notify-match when a new match is inserted
CREATE OR REPLACE FUNCTION public.notify_match_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM extensions.http_post(
    url := 'https://zcsnqvncqzpleqoctzfc.supabase.co/functions/v1/notify-match',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.anon_key', true)
    ),
    body := jsonb_build_object('user1_id', NEW.user1_id, 'user2_id', NEW.user2_id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Fail silently so match creation is never blocked by notification failure
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_match_created
  AFTER INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_match_trigger();