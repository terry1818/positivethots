-- Grants for the CCBill tables (follow-up to 20261127190000). RLS policies already limit reads:
-- members see their own purchases, admins see everything; only the service role writes.
GRANT ALL ON public.payment_events TO service_role;
GRANT ALL ON public.payment_purchases TO service_role;
GRANT SELECT ON public.payment_events TO authenticated;
GRANT SELECT ON public.payment_purchases TO authenticated;
