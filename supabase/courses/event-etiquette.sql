-- Course "Event and Party Etiquette". Built by scripts/course.mjs from content/courses/event-etiquette.md. Do not edit by hand.
BEGIN;
INSERT INTO public.education_modules (slug, title, description, content, tier, order_index, badge_number, estimated_minutes, prerequisite_badges, is_required, is_optional)
VALUES ('event-etiquette', 'Event and Party Etiquette', 'How to prepare for social, sex-positive and play events, handle consent in a crowd, protect people''s privacy, and what to do if something goes wrong.', 'How to prepare for social, sex-positive and play events, handle consent in a crowd, protect people''s privacy, and what to do if something goes wrong.', 'advanced', 29, 34, 20, ARRAY['consent-fundamentals','boundaries-communication']::text[], false, true)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, content = EXCLUDED.content, tier = EXCLUDED.tier,
  order_index = EXCLUDED.order_index, badge_number = EXCLUDED.badge_number, estimated_minutes = EXCLUDED.estimated_minutes,
  prerequisite_badges = EXCLUDED.prerequisite_badges, is_required = EXCLUDED.is_required, is_optional = EXCLUDED.is_optional;
INSERT INTO public.module_sections (id, module_id, section_number, title, content_type, content_text, estimated_minutes, reflection_prompt)
VALUES ('4c105af6-8f28-547c-b2c1-5781ced4e878', (SELECT id FROM public.education_modules WHERE slug = 'event-etiquette'), 1, 'Before You Go', 'article', '## Read the Event''s Rules

Events range from social mixers to sex-positive parties, play parties, kink events and festivals. Each has its own rules about dress, consent, photos, alcohol and what can happen where.

Read the code of conduct before you go. If something is unclear, ask the host. Following the rules is part of the deal of being invited.

## Talk With Partners First

If you are going with a partner or partners, talk before the event, not in the middle of it:

- What is each person open to, and what is off the table?
- How will you check in during the night?
- What is your safer sex plan? (See Sexual Health & Harm Reduction.)
- What happens if one of you wants to leave?

## Plan Your Night

Arrange your own way home, bring any supplies you need, and keep alcohol and other substances low or skip them. You need a clear head to give and receive consent.', 5, 'What would you want to agree with a partner before going to an event together?')
ON CONFLICT (id) DO UPDATE SET module_id = EXCLUDED.module_id, section_number = EXCLUDED.section_number, title = EXCLUDED.title,
  content_text = EXCLUDED.content_text, reflection_prompt = EXCLUDED.reflection_prompt;
INSERT INTO public.module_sections (id, module_id, section_number, title, content_type, content_text, estimated_minutes, reflection_prompt)
VALUES ('209cd450-fbc3-52c2-88b6-69d7b7a95cf8', (SELECT id FROM public.education_modules WHERE slug = 'event-etiquette'), 2, 'Consent in a Crowd', 'article', '## Ask Before Any Touch

Ask before touching anyone, even for a hug, even if you have touched before. Being at an event, wearing certain clothes or flirting is not consent. (See Consent & Sexual Autonomy.)

## Ask Each Person Separately

When you approach a couple or a group, every person gives their own answer. One partner cannot say yes for another.

## No Means No, and Maybe Means No

Take a no, a maybe, a pause or silence as a no. Accept it gracefully the first time. Do not argue, sulk or ask again later in the night.

Someone who is very drunk or high cannot give consent.

## Watching Needs Consent Too

At some events, people play in shared spaces. Follow the event''s rules about watching, keep a respectful distance, and never join or interrupt without asking first.', 5, 'How would you like someone to ask you before touching you?')
ON CONFLICT (id) DO UPDATE SET module_id = EXCLUDED.module_id, section_number = EXCLUDED.section_number, title = EXCLUDED.title,
  content_text = EXCLUDED.content_text, reflection_prompt = EXCLUDED.reflection_prompt;
INSERT INTO public.module_sections (id, module_id, section_number, title, content_type, content_text, estimated_minutes, reflection_prompt)
VALUES ('d329801e-7722-5fec-b69f-e107eb362fd2', (SELECT id FROM public.education_modules WHERE slug = 'event-etiquette'), 3, 'Privacy and Respect', 'article', '## No Photos Without Permission

Never photograph or film anyone without clear permission, and follow the event''s photo rules. Many events ban phones in certain areas.

## Don''t Out Anyone

Do not tell anyone who you saw at an event or what they did. Some people are not open about their relationships, sexuality or interests at work or with family. Outing someone can cost them their job, relationships or safety.

## Respect Everyone''s Space

- Use the names and pronouns people give you.
- Do not hover around people who are busy or who have said no.
- Be kind to newcomers. Everyone was new once.
- Respect hosts and volunteers. They make the event possible.', 5, 'What would you need to feel safe being yourself at an event?')
ON CONFLICT (id) DO UPDATE SET module_id = EXCLUDED.module_id, section_number = EXCLUDED.section_number, title = EXCLUDED.title,
  content_text = EXCLUDED.content_text, reflection_prompt = EXCLUDED.reflection_prompt;
INSERT INTO public.module_sections (id, module_id, section_number, title, content_type, content_text, estimated_minutes, reflection_prompt)
VALUES ('125d74a8-af58-5555-a078-e68f7d38ce70', (SELECT id FROM public.education_modules WHERE slug = 'event-etiquette'), 4, 'When Something Goes Wrong', 'article', '## Tell the Hosts

If someone breaks consent, ignores a no, or makes you or others feel unsafe, tell a host, a consent volunteer or staff right away. Reporting helps keep everyone safe. You do not need to be sure.

## Look Out for Each Other

If someone seems very drunk, unwell or overwhelmed, check on them and get a host. In an emergency in the US, call 911.

## Leaving Early Is Fine

You can leave at any time, for any reason. If you came with partners, follow the plan you agreed for leaving, or send a message so no one worries.

## Check In Afterward

A day or two later, talk with partners about what went well, what felt hard, and what you would change next time. Big nights can bring up big feelings, so make room for care afterward.', 5, 'Who would you tell if you saw something worrying at an event?')
ON CONFLICT (id) DO UPDATE SET module_id = EXCLUDED.module_id, section_number = EXCLUDED.section_number, title = EXCLUDED.title,
  content_text = EXCLUDED.content_text, reflection_prompt = EXCLUDED.reflection_prompt;
DELETE FROM public.module_sections WHERE module_id = (SELECT id FROM public.education_modules WHERE slug = 'event-etiquette') AND id <> ALL(ARRAY['4c105af6-8f28-547c-b2c1-5781ced4e878','209cd450-fbc3-52c2-88b6-69d7b7a95cf8','d329801e-7722-5fec-b69f-e107eb362fd2','125d74a8-af58-5555-a078-e68f7d38ce70']::uuid[]);
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('03bf1f52-154b-56df-aacc-1fd79487ca27', (SELECT id FROM public.education_modules WHERE slug = 'event-etiquette'), 'What should you do before attending an event?', '["Arrive and figure out the rules there","Read the code of conduct and talk through limits with any partners","Drink beforehand to relax"]'::jsonb, 1, 0, 'multiple_choice', false, 'Knowing the rules and agreeing on limits ahead of time sets everyone up for a good night.', 'Knowing the rules and agreeing on limits ahead of time sets everyone up for a good night.', 'Knowing the rules and agreeing on limits ahead of time sets everyone up for a good night.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('891eac45-20e5-5ff7-b3d5-ea057559ecc6', (SELECT id FROM public.education_modules WHERE slug = 'event-etiquette'), 'You approach a couple at a party. Who needs to agree?', '["Only the person you spoke to","Whichever partner seems to be in charge","Each person, separately"]'::jsonb, 2, 1, 'multiple_choice', false, 'Every person consents for themselves.', 'Every person consents for themselves.', 'Every person consents for themselves.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('f9e54709-7fbc-52d7-932f-d65a609328c1', (SELECT id FROM public.education_modules WHERE slug = 'event-etiquette'), 'Someone says "maybe" when you ask to touch them. What does that mean?', '["Treat it as a no and don''t ask again","Ask again in a few minutes","Take it as a yes"]'::jsonb, 0, 2, 'multiple_choice', false, 'A maybe, a pause or silence is a no. Accept it gracefully.', 'A maybe, a pause or silence is a no. Accept it gracefully.', 'A maybe, a pause or silence is a no. Accept it gracefully.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('d3152a7d-b11b-5f82-ad75-ca03bd93e737', (SELECT id FROM public.education_modules WHERE slug = 'event-etiquette'), 'You recognize someone from your neighborhood at an event. What should you do?', '["Tell your neighbors you saw them","Keep it private","Take a photo to remember"]'::jsonb, 1, 3, 'multiple_choice', false, 'Who attends is private. Outing someone can seriously harm them.', 'Who attends is private. Outing someone can seriously harm them.', 'Who attends is private. Outing someone can seriously harm them.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('cf3f37aa-5a54-5189-82b0-1778165e02b3', (SELECT id FROM public.education_modules WHERE slug = 'event-etiquette'), 'Can you take photos at a sex-positive event?', '["Yes, if you don''t post them","Only with clear permission and within the event''s rules","Yes, of the room but not people"]'::jsonb, 1, 4, 'multiple_choice', false, 'Photos need clear permission and must follow the event''s rules.', 'Photos need clear permission and must follow the event''s rules.', 'Photos need clear permission and must follow the event''s rules.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('54aa61ac-0411-5bdb-ac0a-63d1dd97b9b3', (SELECT id FROM public.education_modules WHERE slug = 'event-etiquette'), 'You see consent being broken. What should you do?', '["Wait to see if it happens again","Tell a host or the consent team right away","Confront the person loudly"]'::jsonb, 1, 5, 'multiple_choice', false, 'Hosts and consent teams can act straight away to keep people safe.', 'Hosts and consent teams can act straight away to keep people safe.', 'Hosts and consent teams can act straight away to keep people safe.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
DELETE FROM public.quiz_questions WHERE module_id = (SELECT id FROM public.education_modules WHERE slug = 'event-etiquette') AND id <> ALL(ARRAY['03bf1f52-154b-56df-aacc-1fd79487ca27','891eac45-20e5-5ff7-b3d5-ea057559ecc6','f9e54709-7fbc-52d7-932f-d65a609328c1','d3152a7d-b11b-5f82-ad75-ca03bd93e737','cf3f37aa-5a54-5189-82b0-1778165e02b3','54aa61ac-0411-5bdb-ac0a-63d1dd97b9b3']::uuid[]);
COMMIT;
