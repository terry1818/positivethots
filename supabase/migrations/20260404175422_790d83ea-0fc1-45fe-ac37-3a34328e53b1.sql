CREATE OR REPLACE FUNCTION public.check_max_partner_links()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.partner_links
      WHERE (requester_id = NEW.requester_id OR partner_id = NEW.requester_id)
      AND status = 'accepted') >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 partner links allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;