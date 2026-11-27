-- Narrow the default table privileges on the CCBill tables to what the RLS rules intend:
-- anon gets nothing, authenticated may only read (RLS still decides which rows), service_role writes.
REVOKE ALL ON public.payment_events, public.payment_purchases FROM anon;
REVOKE ALL ON public.payment_events, public.payment_purchases FROM authenticated;
GRANT SELECT ON public.payment_events, public.payment_purchases TO authenticated;
GRANT ALL ON public.payment_events, public.payment_purchases TO service_role;
