CREATE TABLE public.recommended_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'Books',
  url text NOT NULL,
  image_url text,
  is_featured boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.recommended_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read resources"
  ON public.recommended_resources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert resources"
  ON public.recommended_resources FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update resources"
  ON public.recommended_resources FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete resources"
  ON public.recommended_resources FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));