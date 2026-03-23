
-- Fix 1: Tighten user_photos UPDATE policy to prevent moderation_status bypass
-- Users should only be able to update order_index and visibility, not moderation_status
DROP POLICY IF EXISTS "Users can update their own photos" ON public.user_photos;
CREATE POLICY "Users can update their own photos" ON public.user_photos
  FOR UPDATE TO public
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    moderation_status = 'pending'
  );

-- Fix 2: Tighten user_photos INSERT policy to force moderation_status = 'pending'
DROP POLICY IF EXISTS "Users can insert their own photos" ON public.user_photos;
CREATE POLICY "Users can insert their own photos" ON public.user_photos
  FOR INSERT TO public
  WITH CHECK (
    auth.uid() = user_id AND
    moderation_status = 'pending'
  );
