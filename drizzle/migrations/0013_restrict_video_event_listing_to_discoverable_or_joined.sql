ALTER POLICY "Anyone can see video events"
ON public.video_date_events
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    (status IN ('upcoming', 'active') AND scheduled_at >= now())
    OR public.is_video_date_participant(id, auth.uid())
  )
);