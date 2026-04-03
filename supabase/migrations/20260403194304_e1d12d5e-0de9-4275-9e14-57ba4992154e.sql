
INSERT INTO storage.buckets (id, name, public)
VALUES ('tts-audio', 'tts-audio', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "TTS audio is publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'tts-audio');

CREATE POLICY "Service role can upload TTS audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tts-audio');
