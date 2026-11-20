CREATE OR REPLACE FUNCTION public.get_module_counts()
RETURNS TABLE(module_id uuid, section_count bigint, question_count bigint, checkpoint_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
 SELECT m.id,
 (SELECT count(*) FROM public.module_sections s WHERE s.module_id=m.id),
 (SELECT count(*) FROM public.quiz_questions q WHERE q.module_id=m.id AND NOT coalesce(q.is_checkpoint,false)),
 (SELECT count(*) FROM public.quiz_questions q WHERE q.module_id=m.id AND coalesce(q.is_checkpoint,false))
 FROM public.education_modules m WHERE public.require_quiz_user() IS NOT NULL ORDER BY m.order_index;
$$;
REVOKE ALL ON FUNCTION public.get_module_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_module_counts() TO authenticated;
CREATE OR REPLACE FUNCTION public.get_review_questions(_tier text, _limit integer DEFAULT 8)
RETURNS TABLE(id uuid, module_id uuid, question text, options jsonb, order_index integer, section_id uuid, is_checkpoint boolean, position_in_section integer, exercise_type text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
 RETURN QUERY
 SELECT q.id,q.module_id,q.question,q.options,q.order_index,q.section_id,q.is_checkpoint,q.position_in_section,q.exercise_type
 FROM public.quiz_questions q JOIN public.education_modules m ON m.id=q.module_id
 WHERE m.tier=_tier AND NOT coalesce(q.is_checkpoint,false)
 AND EXISTS(SELECT 1 FROM public.user_badges b WHERE b.user_id=auth.uid() AND b.module_id=m.id)
 ORDER BY (SELECT count(*) FROM public.user_quiz_performance p WHERE p.user_id=auth.uid() AND p.question_id=q.id AND p.is_correct=false) DESC, random()
 LIMIT greatest(0,least(coalesce(_limit,8),8));
END;
$$;
REVOKE ALL ON FUNCTION public.get_review_questions(text,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_review_questions(text,integer) TO authenticated;