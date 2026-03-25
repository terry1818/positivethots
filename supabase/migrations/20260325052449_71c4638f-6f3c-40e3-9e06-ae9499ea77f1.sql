
-- Create private verification-selfies bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-selfies', 'verification-selfies', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: authenticated users can upload to their own folder
CREATE POLICY "Users can upload verification selfies to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'verification-selfies'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
