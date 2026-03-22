
-- Tighten flagged_messages insert policy to require sender_id match
DROP POLICY "Service can insert flagged messages" ON public.flagged_messages;
CREATE POLICY "Users can insert own flagged messages" ON public.flagged_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
