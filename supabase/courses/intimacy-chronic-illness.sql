-- Course "Intimacy With Chronic Illness or Pain". Built by scripts/course.mjs from content/courses/intimacy-chronic-illness.md. Do not edit by hand.
BEGIN;
INSERT INTO public.education_modules (slug, title, description, content, tier, order_index, badge_number, estimated_minutes, prerequisite_badges, is_required, is_optional)
VALUES ('intimacy-chronic-illness', 'Intimacy With Chronic Illness or Pain', 'Practical ways to keep intimacy alive when you or a partner live with chronic illness, pain or a long-term condition.', 'Practical ways to keep intimacy alive when you or a partner live with chronic illness, pain or a long-term condition.', 'sexual_health', 27, 32, 20, ARRAY['understanding-desire']::text[], false, true)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, content = EXCLUDED.content, tier = EXCLUDED.tier,
  order_index = EXCLUDED.order_index, badge_number = EXCLUDED.badge_number, estimated_minutes = EXCLUDED.estimated_minutes,
  prerequisite_badges = EXCLUDED.prerequisite_badges, is_required = EXCLUDED.is_required, is_optional = EXCLUDED.is_optional;
INSERT INTO public.module_sections (id, module_id, section_number, title, content_type, content_text, estimated_minutes, reflection_prompt)
VALUES ('fe4905b6-6c57-52c5-ab66-13a7856f5d49', (SELECT id FROM public.education_modules WHERE slug = 'intimacy-chronic-illness'), 1, 'When Health Changes Your Sex Life', 'article', '## You Are Not Broken

Chronic pain, fatigue and long-term conditions such as arthritis, diabetes, heart disease, endometriosis, MS or long COVID can change what sex feels like and how often you want it. This is common, and it does not mean intimacy is over.

Many people with long-term conditions have satisfying intimate lives, often by changing what intimacy looks like. (See Disability and Sexuality for more.)

## Grief Is Normal

It is natural to miss how things used to be, for you and for a partner. Naming that loss, alone or together, often makes it easier to try something new.

## Look Beyond One Kind of Sex

If one kind of sex is painful or tiring, intimacy can include many other things: kissing, massage, mutual touch, oral sex, toys, bathing together or simply lying close. (See Pleasure & Satisfaction for redefining pleasure.)', 5, 'What has a health change taken from your intimate life, and what might still be possible?')
ON CONFLICT (id) DO UPDATE SET module_id = EXCLUDED.module_id, section_number = EXCLUDED.section_number, title = EXCLUDED.title,
  content_text = EXCLUDED.content_text, reflection_prompt = EXCLUDED.reflection_prompt;
INSERT INTO public.module_sections (id, module_id, section_number, title, content_type, content_text, estimated_minutes, reflection_prompt)
VALUES ('fd70080b-2864-5c28-adf8-923f64cf41f1', (SELECT id FROM public.education_modules WHERE slug = 'intimacy-chronic-illness'), 2, 'Planning Around Energy and Pain', 'article', '## Budget Your Energy

Many people with chronic illness think of energy as a limited daily budget. If sex matters to you, plan it for a time you usually have energy, not after a day that has already used it up.

## Time It With Your Treatment

Some people find there is a time of day, or a time after taking medicine, when pain is lowest. Notice your patterns and plan around them. Ask your clinician before changing when you take any medicine.

## Set Up for Comfort

- Use pillows or wedges to support joints and take strain off your back.
- Try positions that need less effort, such as lying side by side.
- Warm up first: a warm bath or shower can ease stiff muscles.
- Use lubricant generously.
- Agree on a simple word or signal to pause or change position.

## Pace Yourself

Shorter sessions, breaks and stopping before pain builds are all fine. Intimacy does not need to follow a script or end in a particular way.', 5, 'When in your day or week do you have the most energy and the least pain?')
ON CONFLICT (id) DO UPDATE SET module_id = EXCLUDED.module_id, section_number = EXCLUDED.section_number, title = EXCLUDED.title,
  content_text = EXCLUDED.content_text, reflection_prompt = EXCLUDED.reflection_prompt;
INSERT INTO public.module_sections (id, module_id, section_number, title, content_type, content_text, estimated_minutes, reflection_prompt)
VALUES ('00113e66-bfce-5b4c-bea5-05986eab0619', (SELECT id FROM public.education_modules WHERE slug = 'intimacy-chronic-illness'), 3, 'Partner, Not Just Caregiver', 'article', '## When Care Crowds Out Romance

When one partner helps with medical care, like medicines, bathing or appointments, it can become hard for both of you to feel like romantic partners. The person receiving care may feel like a patient. The person giving care may feel like a nurse.

## Keep Some Time Just for You Two

Try to keep some time that is only about your relationship, with no care tasks in it. Where possible, outside help with some care, from family, friends or services, can give you room to be partners again.

## Look After the Caregiver Too

Caregivers often put their own needs last and can burn out. Rest, friends, support groups and their own health care matter. A caregiver who is looked after can show up better for the relationship.

## Many Partners, Shared Care

In relationships with more than two people, care and intimacy can be shared across the network. Talk openly about who does what, so no one is overloaded and no one feels left out.', 5, 'Which parts of your relationship feel like care, and which feel like romance?')
ON CONFLICT (id) DO UPDATE SET module_id = EXCLUDED.module_id, section_number = EXCLUDED.section_number, title = EXCLUDED.title,
  content_text = EXCLUDED.content_text, reflection_prompt = EXCLUDED.reflection_prompt;
INSERT INTO public.module_sections (id, module_id, section_number, title, content_type, content_text, estimated_minutes, reflection_prompt)
VALUES ('1b9f050b-ddcd-594a-b541-ef5b436dffa6', (SELECT id FROM public.education_modules WHERE slug = 'intimacy-chronic-illness'), 4, 'Talking With Your Clinicians', 'article', '## Sex Is a Health Topic

Clinicians do not always ask about sex, so you may need to bring it up. Your sexual health is part of your health, and you deserve help with it.

## Ask About Side Effects

Many common medicines, including some for depression, blood pressure and pain, can affect desire, arousal or orgasm. If you notice changes, tell your clinician. There may be other options.

**Do not stop or change a medicine on your own.** Some medicines are dangerous to stop suddenly. (See Common Sexual Concerns for more on medicines and sexual function.)

## Bring Questions

Writing questions down before an appointment makes them easier to ask. For example:

- "Could my medicine be affecting my sex drive?"
- "Is it safe for me to have sex with my condition?"
- "Can you refer me to a pelvic floor physical therapist or a sex therapist?"

## Keep Asking

If a clinician dismisses your concerns, you can ask again, ask for a referral, or see someone else. (See Common Sexual Concerns for finding a provider.)', 5, 'What is one question about sex you have never asked a clinician, and how could you ask it?')
ON CONFLICT (id) DO UPDATE SET module_id = EXCLUDED.module_id, section_number = EXCLUDED.section_number, title = EXCLUDED.title,
  content_text = EXCLUDED.content_text, reflection_prompt = EXCLUDED.reflection_prompt;
DELETE FROM public.module_sections WHERE module_id = (SELECT id FROM public.education_modules WHERE slug = 'intimacy-chronic-illness') AND id <> ALL(ARRAY['fe4905b6-6c57-52c5-ab66-13a7856f5d49','fd70080b-2864-5c28-adf8-923f64cf41f1','00113e66-bfce-5b4c-bea5-05986eab0619','1b9f050b-ddcd-594a-b541-ef5b436dffa6']::uuid[]);
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('9fa65635-fcd6-541f-acf5-99f3594634b7', (SELECT id FROM public.education_modules WHERE slug = 'intimacy-chronic-illness'), 'A long-term condition has changed your sex life. What does this course say?', '["Intimacy is over for good","Intimacy can continue, often in new ways","Only medicine can help"]'::jsonb, 1, 0, 'multiple_choice', false, 'Many people with long-term conditions have satisfying intimate lives by adapting what intimacy looks like.', 'Many people with long-term conditions have satisfying intimate lives by adapting what intimacy looks like.', 'Many people with long-term conditions have satisfying intimate lives by adapting what intimacy looks like.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('5381791f-7d95-527e-8428-d2b62ffbf0da', (SELECT id FROM public.education_modules WHERE slug = 'intimacy-chronic-illness'), 'When is a good time to plan intimacy if you live with fatigue?', '["At the end of the day, once everything else is done","At a time you usually have more energy","Whenever your partner asks"]'::jsonb, 1, 1, 'multiple_choice', false, 'Planning for times you have more energy makes intimacy more likely to feel good.', 'Planning for times you have more energy makes intimacy more likely to feel good.', 'Planning for times you have more energy makes intimacy more likely to feel good.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('6d3a3361-2ccf-5dac-bc56-64dbe491f413', (SELECT id FROM public.education_modules WHERE slug = 'intimacy-chronic-illness'), 'Which of these can make sex more comfortable with chronic pain?', '["Pushing through pain to finish","Avoiding lubricant","Pillows for support, low-effort positions and a signal to pause"]'::jsonb, 2, 2, 'multiple_choice', false, 'Support, easier positions and an agreed pause signal reduce strain and pain.', 'Support, easier positions and an agreed pause signal reduce strain and pain.', 'Support, easier positions and an agreed pause signal reduce strain and pain.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('e461cd25-c9d6-5449-88aa-9adc76fecff9', (SELECT id FROM public.education_modules WHERE slug = 'intimacy-chronic-illness'), 'One partner helps the other with daily care. What protects the romance?', '["Doing all care tasks together, always","Keeping some time just for connection, without care tasks","Never talking about the change"]'::jsonb, 1, 3, 'multiple_choice', false, 'Separating care time from partner time helps both people feel like partners.', 'Separating care time from partner time helps both people feel like partners.', 'Separating care time from partner time helps both people feel like partners.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('1ca3793a-eb5c-58ca-b855-61a78f58ced1', (SELECT id FROM public.education_modules WHERE slug = 'intimacy-chronic-illness'), 'A medicine seems to be lowering your desire. What is the safe next step?', '["Tell your clinician and ask about options","Stop taking it","Halve the dose yourself"]'::jsonb, 0, 4, 'multiple_choice', false, 'Never stop or change a medicine on your own. A clinician can suggest safe alternatives.', 'Never stop or change a medicine on your own. A clinician can suggest safe alternatives.', 'Never stop or change a medicine on your own. A clinician can suggest safe alternatives.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('47962220-9369-54bf-a468-f1db97826756', (SELECT id FROM public.education_modules WHERE slug = 'intimacy-chronic-illness'), 'A clinician brushes off your question about sex. What can you do?', '["Assume nothing can be done","Ask again, ask for a referral, or see someone else","Never bring it up again"]'::jsonb, 1, 5, 'multiple_choice', false, 'Your sexual health deserves care. It is fine to keep asking or find another provider.', 'Your sexual health deserves care. It is fine to keep asking or find another provider.', 'Your sexual health deserves care. It is fine to keep asking or find another provider.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
DELETE FROM public.quiz_questions WHERE module_id = (SELECT id FROM public.education_modules WHERE slug = 'intimacy-chronic-illness') AND id <> ALL(ARRAY['9fa65635-fcd6-541f-acf5-99f3594634b7','5381791f-7d95-527e-8428-d2b62ffbf0da','6d3a3361-2ccf-5dac-bc56-64dbe491f413','e461cd25-c9d6-5449-88aa-9adc76fecff9','1ca3793a-eb5c-58ca-b855-61a78f58ced1','47962220-9369-54bf-a468-f1db97826756']::uuid[]);
COMMIT;
