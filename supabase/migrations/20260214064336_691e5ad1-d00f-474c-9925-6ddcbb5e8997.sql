
-- Create profile-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true);

-- Allow public read access
CREATE POLICY "Public read access for profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

-- Allow service role to upload (edge function uses service role key)
CREATE POLICY "Service role can upload profile images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "Service role can update profile images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-images');
