-- Fix: Restrict quiz_questions SELECT to admins only (users use quiz_questions_public view)
DROP POLICY IF EXISTS "Anyone can read quiz questions" ON public.quiz_questions;

CREATE POLICY "Admins can read quiz questions"
  ON public.quiz_questions FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Fix: Add granted_by constraint to user_roles INSERT
DROP POLICY IF EXISTS "Admins can grant roles" ON public.user_roles;

CREATE POLICY "Admins can grant roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid()) 
    AND granted_by = auth.uid()
  );

-- Fix: Set search_path on update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Fix: Set search_path on check_match function  
CREATE OR REPLACE FUNCTION public.check_match(user1 uuid, user2 uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  match_id UUID;
  normalized_user1 UUID;
  normalized_user2 UUID;
BEGIN
  IF user1 < user2 THEN
    normalized_user1 := user1;
    normalized_user2 := user2;
  ELSE
    normalized_user1 := user2;
    normalized_user2 := user1;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.swipes
    WHERE swiper_id = user1 AND swiped_id = user2 AND direction = 'right'
  ) AND EXISTS (
    SELECT 1 FROM public.swipes
    WHERE swiper_id = user2 AND swiped_id = user1 AND direction = 'right'
  ) THEN
    INSERT INTO public.matches (user1_id, user2_id)
    VALUES (normalized_user1, normalized_user2)
    ON CONFLICT (user1_id, user2_id) DO NOTHING
    RETURNING id INTO match_id;

    IF match_id IS NULL THEN
      SELECT id INTO match_id FROM public.matches
      WHERE user1_id = normalized_user1 AND user2_id = normalized_user2;
    END IF;

    RETURN match_id;
  END IF;

  RETURN NULL;
END;
$function$;