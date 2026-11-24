-- Course "Intimacy After Becoming a Parent". Built by scripts/course.mjs from content/courses/intimacy-after-parenthood.md. Do not edit by hand.
BEGIN;
INSERT INTO public.education_modules (slug, title, description, content, tier, order_index, badge_number, estimated_minutes, prerequisite_badges, is_required, is_optional)
VALUES ('intimacy-after-parenthood', 'Intimacy After Becoming a Parent', 'How a new child changes desire, bodies and time, and practical ways to stay close as partners, not just co-parents.', 'How a new child changes desire, bodies and time, and practical ways to stay close as partners, not just co-parents.', 'sexual_health', 26, 31, 20, ARRAY['understanding-desire']::text[], false, true)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, content = EXCLUDED.content, tier = EXCLUDED.tier,
  order_index = EXCLUDED.order_index, badge_number = EXCLUDED.badge_number, estimated_minutes = EXCLUDED.estimated_minutes,
  prerequisite_badges = EXCLUDED.prerequisite_badges, is_required = EXCLUDED.is_required, is_optional = EXCLUDED.is_optional;
INSERT INTO public.module_sections (id, module_id, section_number, title, content_type, content_text, estimated_minutes, reflection_prompt)
VALUES ('655c79d9-437d-5935-8dcc-8652345b810f', (SELECT id FROM public.education_modules WHERE slug = 'intimacy-after-parenthood'), 1, 'What Changes and Why', 'article', '## Every Path to Parenthood

People become parents in many ways: giving birth, a partner giving birth, adoption, fostering, surrogacy, or joining a family that already has children. Every path brings a new person who needs a lot of time and attention.

This lesson is for all parents, in any relationship structure. Some parts, like healing after birth, apply only to some people.

## Why Desire Often Drops

Common reasons desire dips after a child arrives:

- **Sleep loss.** Tired bodies put rest ahead of sex.
- **Feeling "touched out".** After hours of holding and feeding a baby, more touch can feel like too much.
- **A new identity.** Many parents need time to feel like a sexual person again, not only a parent.
- **Hormones.** After giving birth, and while breastfeeding or chestfeeding, hormone changes can lower desire and cause vaginal dryness.

None of this means something is wrong with you or your relationship.

## Desire Can Come Back Differently

For many parents, desire becomes more responsive: it shows up after closeness begins instead of before. That is a normal way to feel desire, not a lesser one. (See Understanding Desire for more on responsive desire.)', 5, 'What has changed most for you, or what do you expect to change most, when a child joins your life?')
ON CONFLICT (id) DO UPDATE SET module_id = EXCLUDED.module_id, section_number = EXCLUDED.section_number, title = EXCLUDED.title,
  content_text = EXCLUDED.content_text, reflection_prompt = EXCLUDED.reflection_prompt;
INSERT INTO public.module_sections (id, module_id, section_number, title, content_type, content_text, estimated_minutes, reflection_prompt)
VALUES ('6dc893ed-61be-503a-bdbc-9bfe1272512b', (SELECT id FROM public.education_modules WHERE slug = 'intimacy-after-parenthood'), 2, 'After Birth: Healing and Body Changes', 'article', '## Wait for the Okay

After giving birth, the body needs time to heal. Ask your doctor or midwife when it is safe to have sex again. Many people are checked a few weeks after birth, but everyone heals at their own pace.

Getting the OK is permission, not a deadline. Start when you feel ready.

## Go Slowly and Use Lube

- Start with touch you both enjoy, without a goal.
- Use plenty of lubricant, especially while breastfeeding or chestfeeding, when dryness is common.
- Stop if something hurts. **Pain is a signal, not something to push through.**

Ongoing pain is worth raising with your clinician. A pelvic floor physical therapist can help with pain, leaking and recovery.

## Plan for Contraception

It is possible to get pregnant again before periods return, even while breastfeeding or chestfeeding. If you do not want another pregnancy yet, talk about contraception with your clinician before you start having sex again.

## Mental Health Matters Too

Depression and anxiety after a new child are common, can affect any parent (not only the one who gave birth), and are very treatable. Signs include feeling hopeless, numb, constantly anxious, or unable to enjoy anything for more than two weeks.

In the US, the National Maternal Mental Health Hotline is free and open any time: call or text 1-833-852-6262. If you think about harming yourself or your baby, call 988 or 911 right away.', 5, 'What would help you feel ready, physically and emotionally, to be sexual again after a birth?')
ON CONFLICT (id) DO UPDATE SET module_id = EXCLUDED.module_id, section_number = EXCLUDED.section_number, title = EXCLUDED.title,
  content_text = EXCLUDED.content_text, reflection_prompt = EXCLUDED.reflection_prompt;
INSERT INTO public.module_sections (id, module_id, section_number, title, content_type, content_text, estimated_minutes, reflection_prompt)
VALUES ('a4114dc2-ad6d-5719-b935-e1ccf27088b2', (SELECT id FROM public.education_modules WHERE slug = 'intimacy-after-parenthood'), 3, 'Staying Partners, Not Just Co-Parents', 'article', '## Share the Load Fairly

Desire often fades when one person carries most of the work, including the planning and remembering (sometimes called the mental load). It is hard to feel close to someone you feel like you are managing.

Sit down together and list everything the household needs, from night feeds to booking appointments. Decide together who owns what, and check in every few weeks.

## Small, Daily Connection

Short moments add up: a real hug, a few minutes of talking about something other than the baby, a thank-you for something specific. (See Maintaining Long-term Intimacy for more ideas.)

## Touch Without Pressure

Agree that some touch is just touch, with no expectation that it leads to sex. When affection does not come with pressure, many parents find they want more of it.

## Planning Isn''t Unromantic

With a child at home, spontaneous time is rare. Planning time together is not a sign that the spark is gone. It is how busy parents make room for each other.', 5, 'What is one small way you could show your partner you still see them as a partner, not only a co-parent?')
ON CONFLICT (id) DO UPDATE SET module_id = EXCLUDED.module_id, section_number = EXCLUDED.section_number, title = EXCLUDED.title,
  content_text = EXCLUDED.content_text, reflection_prompt = EXCLUDED.reflection_prompt;
INSERT INTO public.module_sections (id, module_id, section_number, title, content_type, content_text, estimated_minutes, reflection_prompt)
VALUES ('64ae7874-bb4b-5ff7-8a50-a543a572f29c', (SELECT id FROM public.education_modules WHERE slug = 'intimacy-after-parenthood'), 4, 'Talking About Sex and Getting Support', 'article', '## Talk About It Without Blame

Try "I" statements: "I miss feeling close to you" works better than "You never want sex anymore." Ask your partner how they are experiencing this time too. You are on the same side.

## Different Levels of Desire

It is very common for partners'' desire to differ after a child arrives. Neither person is wrong. Talk about what each of you needs, look for kinds of intimacy that work for both of you, and revisit it as things change.

If your family includes more than two adults, include everyone affected in these talks and in planning time together.

## When to Get Help

If you feel stuck, resentful or distant for months, a couples therapist or sex therapist can help. (See Common Sexual Concerns for finding the right professional.)', 5, 'What would you want a partner to know about how your desire has changed?')
ON CONFLICT (id) DO UPDATE SET module_id = EXCLUDED.module_id, section_number = EXCLUDED.section_number, title = EXCLUDED.title,
  content_text = EXCLUDED.content_text, reflection_prompt = EXCLUDED.reflection_prompt;
DELETE FROM public.module_sections WHERE module_id = (SELECT id FROM public.education_modules WHERE slug = 'intimacy-after-parenthood') AND id <> ALL(ARRAY['655c79d9-437d-5935-8dcc-8652345b810f','6dc893ed-61be-503a-bdbc-9bfe1272512b','a4114dc2-ad6d-5719-b935-e1ccf27088b2','64ae7874-bb4b-5ff7-8a50-a543a572f29c']::uuid[]);
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('01da4eb4-98ce-58d3-9679-97c94c0e741d', (SELECT id FROM public.education_modules WHERE slug = 'intimacy-after-parenthood'), 'Why does desire often drop after a child joins the family?', '["Because the relationship is failing","Sleep loss, feeling touched out, identity changes and hormones","Because parents are no longer attracted to each other"]'::jsonb, 1, 0, 'multiple_choice', false, 'Exhaustion, constant caregiving, a shifting sense of self and hormones are common, normal reasons.', 'Exhaustion, constant caregiving, a shifting sense of self and hormones are common, normal reasons.', 'Exhaustion, constant caregiving, a shifting sense of self and hormones are common, normal reasons.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('9158909c-9855-5547-9b47-e9c0a8c78d22', (SELECT id FROM public.education_modules WHERE slug = 'intimacy-after-parenthood'), 'When can someone who has given birth start having sex again?', '["After exactly six weeks, no matter what","When their clinician says it''s safe and they feel ready","As soon as their partner wants to"]'::jsonb, 1, 1, 'multiple_choice', false, 'The clinician''s OK is permission, not a deadline. Start when you feel ready.', 'The clinician''s OK is permission, not a deadline. Start when you feel ready.', 'The clinician''s OK is permission, not a deadline. Start when you feel ready.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('fcb09185-c674-50da-9772-3a522ccb4674', (SELECT id FROM public.education_modules WHERE slug = 'intimacy-after-parenthood'), 'Can you get pregnant before your period returns after giving birth?', '["Yes, so plan contraception before having sex again","No, it is impossible while breastfeeding or chestfeeding","Only after six months"]'::jsonb, 0, 2, 'multiple_choice', false, 'Pregnancy is possible before periods return. Talk about contraception before you start again.', 'Pregnancy is possible before periods return. Talk about contraception before you start again.', 'Pregnancy is possible before periods return. Talk about contraception before you start again.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('6db28cdd-3cfc-5c33-94d7-4c47b6caa7ba', (SELECT id FROM public.education_modules WHERE slug = 'intimacy-after-parenthood'), 'Who can experience depression or anxiety after a new child arrives?', '["Only the parent who gave birth","Only first-time parents","Any parent, including partners and adoptive parents"]'::jsonb, 2, 3, 'multiple_choice', false, 'Any new parent can be affected, and it is very treatable.', 'Any new parent can be affected, and it is very treatable.', 'Any new parent can be affected, and it is very treatable.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('3ccb0e8b-50fa-5993-9aa8-4b087facbdff', (SELECT id FROM public.education_modules WHERE slug = 'intimacy-after-parenthood'), 'What often helps desire return when one partner does most of the work?', '["Sharing the household work, including the planning, more fairly","Having sex more often to reconnect","Ignoring the chores until the child is older"]'::jsonb, 0, 4, 'multiple_choice', false, 'When the load is shared fairly, partners are more likely to feel close and want each other.', 'When the load is shared fairly, partners are more likely to feel close and want each other.', 'When the load is shared fairly, partners are more likely to feel close and want each other.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('51a91f96-6d0f-533c-9621-585345e44066', (SELECT id FROM public.education_modules WHERE slug = 'intimacy-after-parenthood'), 'Partners want different amounts of sex after a baby. What is the best approach?', '["Decide who is right","Wait for it to fix itself","Talk openly about each person''s needs and revisit as things change"]'::jsonb, 2, 5, 'multiple_choice', false, 'Desire differences are common. Talking openly and revisiting the plan works better than blame.', 'Desire differences are common. Talking openly and revisiting the plan works better than blame.', 'Desire differences are common. Talking openly and revisiting the plan works better than blame.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
DELETE FROM public.quiz_questions WHERE module_id = (SELECT id FROM public.education_modules WHERE slug = 'intimacy-after-parenthood') AND id <> ALL(ARRAY['01da4eb4-98ce-58d3-9679-97c94c0e741d','9158909c-9855-5547-9b47-e9c0a8c78d22','fcb09185-c674-50da-9772-3a522ccb4674','6db28cdd-3cfc-5c33-94d7-4c47b6caa7ba','3ccb0e8b-50fa-5993-9aa8-4b087facbdff','51a91f96-6d0f-533c-9621-585345e44066']::uuid[]);
COMMIT;
