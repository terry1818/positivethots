
-- Fix security definer view: make it SECURITY INVOKER (default, just recreate without security definer)
DROP VIEW IF EXISTS public.quiz_questions_public;
CREATE VIEW public.quiz_questions_public 
WITH (security_invoker = true) AS
  SELECT id, module_id, question, options, order_index, section_id
  FROM public.quiz_questions;

-- Fix function search path on update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
