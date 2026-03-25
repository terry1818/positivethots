CREATE POLICY "Service role can read verification selfies"
ON storage.objects FOR SELECT TO service_role
USING (bucket_id = 'verification-selfies');