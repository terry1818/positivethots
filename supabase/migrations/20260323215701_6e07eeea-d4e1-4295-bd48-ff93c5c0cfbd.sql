-- Events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  host_name text NOT NULL,
  event_date timestamp with time zone NOT NULL,
  price_cents integer NOT NULL DEFAULT 0,
  stripe_price_id text,
  capacity integer NOT NULL DEFAULT 50,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active events" ON public.events
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage events" ON public.events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Event registrations table
CREATE TABLE public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  stripe_payment_intent_id text
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own registrations" ON public.event_registrations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert registrations" ON public.event_registrations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Super like purchases tracking
CREATE TABLE public.super_like_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pack_size integer NOT NULL,
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  stripe_payment_intent_id text
);

ALTER TABLE public.super_like_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON public.super_like_purchases
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" ON public.super_like_purchases
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);