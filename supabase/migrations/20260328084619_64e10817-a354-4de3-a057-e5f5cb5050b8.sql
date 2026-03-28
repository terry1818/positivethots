
CREATE TABLE public.photo_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES public.user_photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  impressions integer NOT NULL DEFAULT 0,
  right_swipes integer NOT NULL DEFAULT 0,
  left_swipes integer NOT NULL DEFAULT 0,
  super_likes integer NOT NULL DEFAULT 0,
  score numeric NOT NULL DEFAULT 0,
  period_start date NOT NULL DEFAULT CURRENT_DATE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(photo_id, period_start)
);

ALTER TABLE public.photo_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own photo stats"
  ON public.photo_performance FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated can insert photo stats"
  ON public.photo_performance FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update photo stats"
  ON public.photo_performance FOR UPDATE TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.track_photo_engagement(
  _photo_id uuid,
  _photo_owner_id uuid,
  _action text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.photo_performance (photo_id, user_id, period_start,
    impressions, right_swipes, left_swipes, super_likes)
  VALUES (_photo_id, _photo_owner_id, CURRENT_DATE,
    CASE WHEN _action = 'impression' THEN 1 ELSE 0 END,
    CASE WHEN _action = 'right' THEN 1 ELSE 0 END,
    CASE WHEN _action = 'left' THEN 1 ELSE 0 END,
    CASE WHEN _action = 'super_like' THEN 1 ELSE 0 END)
  ON CONFLICT (photo_id, period_start) DO UPDATE SET
    impressions = photo_performance.impressions + CASE WHEN _action = 'impression' THEN 1 ELSE 0 END,
    right_swipes = photo_performance.right_swipes + CASE WHEN _action = 'right' THEN 1 ELSE 0 END,
    left_swipes = photo_performance.left_swipes + CASE WHEN _action = 'left' THEN 1 ELSE 0 END,
    super_likes = photo_performance.super_likes + CASE WHEN _action = 'super_like' THEN 1 ELSE 0 END,
    score = CASE WHEN (photo_performance.impressions + CASE WHEN _action = 'impression' THEN 1 ELSE 0 END) > 0
      THEN ((photo_performance.right_swipes + CASE WHEN _action = 'right' THEN 1 ELSE 0 END +
             (photo_performance.super_likes + CASE WHEN _action = 'super_like' THEN 1 ELSE 0 END) * 3)::numeric /
            (photo_performance.impressions + CASE WHEN _action = 'impression' THEN 1 ELSE 0 END)) * 100
      ELSE 0 END,
    updated_at = now();
END;
$$;
