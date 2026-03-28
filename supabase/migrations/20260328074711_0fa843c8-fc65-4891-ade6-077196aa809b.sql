
CREATE TABLE public.private_photo_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  granter_id UUID NOT NULL,
  grantee_id UUID NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  UNIQUE (granter_id, grantee_id)
);

ALTER TABLE public.private_photo_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own grants and grants to them"
  ON public.private_photo_access
  FOR SELECT
  TO authenticated
  USING (auth.uid() = granter_id OR auth.uid() = grantee_id);

CREATE POLICY "Users can insert their own grants"
  ON public.private_photo_access
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = granter_id);

CREATE POLICY "Users can update their own grants"
  ON public.private_photo_access
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = granter_id)
  WITH CHECK (auth.uid() = granter_id);
