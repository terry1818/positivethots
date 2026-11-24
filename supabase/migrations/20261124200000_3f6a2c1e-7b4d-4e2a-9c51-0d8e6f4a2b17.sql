-- Data retention (owner's task "Define and implement message retention policy", November 2026).
--
-- Messages: a conversation's messages are deleted once it has gone 12 months without a new message.
-- They are also deleted at once when either person unmatches (matches -> messages cascade) or closes
-- their account (manage-account). Messages flagged for safety review are kept until the review closes.
-- Error logs: deleted after 90 days, as the Privacy Policy already states.
--
-- Safe to run more than once.

CREATE OR REPLACE FUNCTION public.purge_expired_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _messages integer := 0; _errors integer := 0;
BEGIN
  WITH idle AS (
    SELECT m.match_id
    FROM public.messages m
    GROUP BY m.match_id
    HAVING max(m.created_at) < now() - interval '12 months'
  )
  DELETE FROM public.messages msg
  USING idle
  WHERE msg.match_id = idle.match_id
    AND NOT EXISTS (SELECT 1 FROM public.flagged_messages f WHERE f.match_id = msg.match_id AND f.reviewed_at IS NULL);
  GET DIAGNOSTICS _messages = ROW_COUNT;

  DELETE FROM public.error_logs WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS _errors = ROW_COUNT;

  INSERT INTO public.audit_log (admin_user_id, action, details)
  VALUES ('00000000-0000-0000-0000-000000000000', 'purge_expired_data',
          jsonb_build_object('messages_removed', _messages, 'error_logs_removed', _errors));

  RETURN jsonb_build_object('messages_removed', _messages, 'error_logs_removed', _errors);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purge_expired_data() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_data() TO service_role;

DO $$
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'purge-expired-data';
  PERFORM cron.schedule('purge-expired-data', '15 3 * * *', 'SELECT public.purge_expired_data();');
END $$;
