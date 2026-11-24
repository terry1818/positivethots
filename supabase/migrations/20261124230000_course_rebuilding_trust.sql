-- Course "Rebuilding Trust After a Betrayal". Built by scripts/course.mjs from content/courses/rebuilding-trust.md. Do not edit by hand.
BEGIN;
INSERT INTO public.education_modules (slug, title, description, content, tier, order_index, badge_number, estimated_minutes, prerequisite_badges, is_required, is_optional)
VALUES ('rebuilding-trust', 'Rebuilding Trust After a Betrayal', 'What a betrayal does to both people, how real repair works, and how to decide whether to rebuild or move on.', 'What a betrayal does to both people, how real repair works, and how to decide whether to rebuild or move on.', 'relationships', 30, 33, 25, ARRAY['navigating-conflict']::text[], false, true)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, content = EXCLUDED.content, tier = EXCLUDED.tier,
  order_index = EXCLUDED.order_index, badge_number = EXCLUDED.badge_number, estimated_minutes = EXCLUDED.estimated_minutes,
  prerequisite_badges = EXCLUDED.prerequisite_badges, is_required = EXCLUDED.is_required, is_optional = EXCLUDED.is_optional;
INSERT INTO public.module_sections (id, module_id, section_number, title, content_type, content_text, estimated_minutes, reflection_prompt)
VALUES ('0fe5c755-6d72-513c-8df7-420713cca15b', (SELECT id FROM public.education_modules WHERE slug = 'rebuilding-trust'), 1, 'What a Betrayal Does', 'article', '## Betrayal Takes Many Forms

Betrayal is breaking an agreement someone relied on. It can look like a hidden affair, secret messages, breaking an agreement in an open relationship, hiding money, or lying about something important.

It can happen in any relationship structure. What matters is that trust was broken, not which rule it was.

## Strong Reactions Are Normal

After discovering a betrayal, many people have trauma-like reactions: shock, trouble sleeping, replaying events, a strong urge to check a partner''s phone, and swings between anger and closeness. These reactions are common and usually ease with time and the right support.

## Both People Can Hurt

The partner who broke trust often feels guilt and shame too. Their pain is real, but the hurt partner''s pain comes first while repair begins.

## Repair Is a Choice

No one is obligated to stay after a betrayal. Repair only works when both people choose it. Taking time before deciding is fine.

If the relationship involves abuse, control or threats, this course is not the right path. Safety comes first: reach out to a domestic violence service such as the National Domestic Violence Hotline (1-800-799-7233).', 5, 'What does trust mean to you, and how do you know when you have it?')
ON CONFLICT (id) DO UPDATE SET module_id = EXCLUDED.module_id, section_number = EXCLUDED.section_number, title = EXCLUDED.title,
  content_text = EXCLUDED.content_text, reflection_prompt = EXCLUDED.reflection_prompt;
INSERT INTO public.module_sections (id, module_id, section_number, title, content_type, content_text, estimated_minutes, reflection_prompt)
VALUES ('086b543b-50a7-5003-939c-42342e094d9b', (SELECT id FROM public.education_modules WHERE slug = 'rebuilding-trust'), 2, 'Taking Responsibility', 'article', '## End It and Own It

Couples researchers John and Julie Gottman describe trust repair in three phases: atone, attune and attach. Atoning starts here.

Repair cannot start while the betrayal is still going on. The person who broke trust ends it and takes full responsibility, without blaming the other partner or the circumstances.

## Answer Questions Honestly

The hurt partner will have questions, often the same ones many times. Answer honestly and patiently. New lies discovered later do more damage than the original truth.

It can help to agree on when and how to talk, so questions do not take over every moment.

## Offer Openness

Offering openness, such as sharing where you are or being open about your messages for a while, can help the hurt partner feel safer. It works best when it is offered freely and agreed together, with a plan to ease it as trust grows.

## A Real Apology

A real apology names what you did, shows you understand how it hurt, and says what you will do differently. It does not demand forgiveness or set a deadline for "getting over it".', 5, 'What does a real apology sound like to you?')
ON CONFLICT (id) DO UPDATE SET module_id = EXCLUDED.module_id, section_number = EXCLUDED.section_number, title = EXCLUDED.title,
  content_text = EXCLUDED.content_text, reflection_prompt = EXCLUDED.reflection_prompt;
INSERT INTO public.module_sections (id, module_id, section_number, title, content_type, content_text, estimated_minutes, reflection_prompt)
VALUES ('d87a0890-e22c-5c98-9886-701fe8ebc18c', (SELECT id FROM public.education_modules WHERE slug = 'rebuilding-trust'), 3, 'Understanding and Reconnecting', 'article', '## Understand Without Excusing

In the attune phase, partners look at what was happening in the relationship before the betrayal, such as distance, unmet needs or avoided conversations. Understanding this helps prevent it from happening again.

Understanding is not an excuse. The person who broke trust is still responsible for their choice.

## Expect Triggers

Anniversaries, places, songs or a late reply can bring the hurt rushing back. This is normal. Agree how the hurt partner can say "I''m triggered" and how the other partner will respond with comfort, not defensiveness.

## Rebuild Closeness Slowly

Trust grows from many small, reliable actions: doing what you said, showing up on time, turning toward each other''s bids for attention. Grand gestures alone do not rebuild it. (See Emotional Intelligence for more on bids.)', 5, 'What did your relationship need before the betrayal that it wasn''t getting?')
ON CONFLICT (id) DO UPDATE SET module_id = EXCLUDED.module_id, section_number = EXCLUDED.section_number, title = EXCLUDED.title,
  content_text = EXCLUDED.content_text, reflection_prompt = EXCLUDED.reflection_prompt;
INSERT INTO public.module_sections (id, module_id, section_number, title, content_type, content_text, estimated_minutes, reflection_prompt)
VALUES ('7e9548bb-4f80-5783-a3d8-0f89750b7971', (SELECT id FROM public.education_modules WHERE slug = 'rebuilding-trust'), 4, 'New Agreements and the Road Ahead', 'article', '## Make New Agreements

In the attach phase, partners build a new relationship rather than trying to return to the old one. Make new agreements together that both of you believe in and can keep, and agree when to review them. (See Agreements vs Rules in Advanced ENM Practices for how to build agreements.)

## It Takes Time

Rebuilding trust often takes many months or longer, with good days and hard days. Setbacks do not mean failure.

## Get Outside Help

A couples therapist with experience in betrayal can guide both partners, slow down painful conversations and help you decide your next steps. Each person may benefit from their own support too.

## Ending Is Also Valid

Sometimes, after real effort, one or both people decide to end the relationship. That is a valid outcome, not a failure. (See Grief, Loss & Relationship Transitions for ending with care.)', 5, 'What would you need to see to feel trust growing again?')
ON CONFLICT (id) DO UPDATE SET module_id = EXCLUDED.module_id, section_number = EXCLUDED.section_number, title = EXCLUDED.title,
  content_text = EXCLUDED.content_text, reflection_prompt = EXCLUDED.reflection_prompt;
DELETE FROM public.module_sections WHERE module_id = (SELECT id FROM public.education_modules WHERE slug = 'rebuilding-trust') AND id <> ALL(ARRAY['0fe5c755-6d72-513c-8df7-420713cca15b','086b543b-50a7-5003-939c-42342e094d9b','d87a0890-e22c-5c98-9886-701fe8ebc18c','7e9548bb-4f80-5783-a3d8-0f89750b7971']::uuid[]);
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('93e0cfc1-ca7c-52ae-a583-376eb8dbb02a', (SELECT id FROM public.education_modules WHERE slug = 'rebuilding-trust'), 'What counts as a betrayal?', '["Only a sexual affair","Breaking any agreement a partner relied on, in any relationship structure","Only lying about money"]'::jsonb, 1, 0, 'multiple_choice', false, 'Betrayal is breaking an agreement someone relied on, whatever form it takes.', 'Betrayal is breaking an agreement someone relied on, whatever form it takes.', 'Betrayal is breaking an agreement someone relied on, whatever form it takes.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('4c26513e-50f8-5681-adb5-c56166225499', (SELECT id FROM public.education_modules WHERE slug = 'rebuilding-trust'), 'After a betrayal is discovered, what is required before repair can start?', '["The hurt partner forgives right away","The betrayal ends and the person responsible owns it fully","Both partners agree to forget it"]'::jsonb, 1, 1, 'multiple_choice', false, 'Repair cannot begin while the betrayal continues or while responsibility is being avoided.', 'Repair cannot begin while the betrayal continues or while responsibility is being avoided.', 'Repair cannot begin while the betrayal continues or while responsibility is being avoided.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('eec075da-9b19-5186-8193-e20ca92eccd6', (SELECT id FROM public.education_modules WHERE slug = 'rebuilding-trust'), 'Which is a sign of a real apology?', '["It explains why the hurt partner caused it","It sets a deadline for forgiveness","It names the action, recognizes the hurt and commits to change"]'::jsonb, 2, 2, 'multiple_choice', false, 'A real apology takes responsibility and does not rush the other person.', 'A real apology takes responsibility and does not rush the other person.', 'A real apology takes responsibility and does not rush the other person.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('6ea03287-fd8e-548a-a09f-ebff4ac52d20', (SELECT id FROM public.education_modules WHERE slug = 'rebuilding-trust'), 'Understanding what led to a betrayal…', '["helps prevent it again, without excusing it","means the hurt partner shares the blame","is not needed if the apology was good"]'::jsonb, 0, 3, 'multiple_choice', false, 'Understanding the context helps prevent a repeat. The person who broke trust is still responsible.', 'Understanding the context helps prevent a repeat. The person who broke trust is still responsible.', 'Understanding the context helps prevent a repeat. The person who broke trust is still responsible.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('153e26af-1a7b-5217-a0d4-d646c66d3131', (SELECT id FROM public.education_modules WHERE slug = 'rebuilding-trust'), 'A reminder brings the pain back months later. What is most helpful?', '["Telling the hurt partner to move on","Calm comfort and honest answers","Avoiding the topic completely"]'::jsonb, 1, 4, 'multiple_choice', false, 'Triggers are normal. Comfort and honesty rebuild safety.', 'Triggers are normal. Comfort and honesty rebuild safety.', 'Triggers are normal. Comfort and honesty rebuild safety.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('0fcb25f2-1442-56db-a597-7b5caed1e683', (SELECT id FROM public.education_modules WHERE slug = 'rebuilding-trust'), 'After real effort, a couple decides to separate. What does this course say?', '["They failed at repair","They didn''t try hard enough","Ending can also be a valid, healthy outcome"]'::jsonb, 2, 5, 'multiple_choice', false, 'Not every relationship should continue. Ending with care can be a healthy choice.', 'Not every relationship should continue. Ending with care can be a healthy choice.', 'Not every relationship should continue. Ending with care can be a healthy choice.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
DELETE FROM public.quiz_questions WHERE module_id = (SELECT id FROM public.education_modules WHERE slug = 'rebuilding-trust') AND id <> ALL(ARRAY['93e0cfc1-ca7c-52ae-a583-376eb8dbb02a','4c26513e-50f8-5681-adb5-c56166225499','eec075da-9b19-5186-8193-e20ca92eccd6','6ea03287-fd8e-548a-a09f-ebff4ac52d20','153e26af-1a7b-5217-a0d4-d646c66d3131','0fcb25f2-1442-56db-a597-7b5caed1e683']::uuid[]);
COMMIT;
