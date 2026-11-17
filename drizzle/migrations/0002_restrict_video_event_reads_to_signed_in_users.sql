ALTER POLICY "Anyone can see video events"
ON public.video_date_events
TO authenticated
USING (auth.uid() IS NOT NULL);
