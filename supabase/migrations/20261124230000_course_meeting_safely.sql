-- Course "Meeting Someone Safely the First Time". Built by scripts/course.mjs from content/courses/meeting-safely.md. Do not edit by hand.
BEGIN;
INSERT INTO public.education_modules (slug, title, description, content, tier, order_index, badge_number, estimated_minutes, prerequisite_badges, is_required, is_optional)
VALUES ('meeting-safely', 'Meeting Someone Safely the First Time', 'How to check someone is who they say they are, plan a first meeting that keeps you in control, and leave or get help if something feels wrong.', 'How to check someone is who they say they are, plan a first meeting that keeps you in control, and leave or get help if something feels wrong.', 'dating_safety', 1, 30, 20, ARRAY['consent-fundamentals']::text[], false, true)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, content = EXCLUDED.content, tier = EXCLUDED.tier,
  order_index = EXCLUDED.order_index, badge_number = EXCLUDED.badge_number, estimated_minutes = EXCLUDED.estimated_minutes,
  prerequisite_badges = EXCLUDED.prerequisite_badges, is_required = EXCLUDED.is_required, is_optional = EXCLUDED.is_optional;
INSERT INTO public.module_sections (id, module_id, section_number, title, content_type, content_text, estimated_minutes, reflection_prompt)
VALUES ('a17c16fd-6a1e-5259-9692-b6b167f63bc5', (SELECT id FROM public.education_modules WHERE slug = 'meeting-safely'), 1, 'Before You Meet', 'article', '## Why a Little Checking Helps

Meeting someone new is exciting. Most people you talk to are exactly who they say they are. A few are not, and the checks below take only a few minutes.

Checking is not rude and it is not a sign of distrust. People who mean well usually expect it and often do the same checks on you.

## Make Sure They Are Real

- **Have a short video call first.** A few minutes on camera confirms the person matches their photos and gives you a feel for them.
- **Look for a consistent story.** Name, age, work and where they live should line up across what they tell you.
- **Search their photos.** A reverse image search shows whether the pictures belong to someone else.
- **Notice their verification.** A verified profile is a good sign, not a guarantee.

If someone always has a reason not to show their face on camera, take that seriously.

## Warning Signs in Messages

Slow down or stop if someone:

- pushes to move the conversation off the app very quickly
- refuses a video call again and again
- tells a dramatic story and then asks for money, gift cards or crypto
- pressures you for photos, your home address or where you work
- gets angry when you set a limit or take time to reply

**Never send money to someone you have not met in person.** Asking for money is the most common sign of a scam.

## Trust Your Gut

You do not need evidence to step back. If something feels off, you can pause, ask more questions, or stop talking. A person who respects you will respect that.', 5, 'What is one safety step you skipped in the past that you want to make a habit?')
ON CONFLICT (id) DO UPDATE SET module_id = EXCLUDED.module_id, section_number = EXCLUDED.section_number, title = EXCLUDED.title,
  content_text = EXCLUDED.content_text, reflection_prompt = EXCLUDED.reflection_prompt;
INSERT INTO public.module_sections (id, module_id, section_number, title, content_type, content_text, estimated_minutes, reflection_prompt)
VALUES ('5b12fe43-d858-52bc-80c5-13a7ddc657e9', (SELECT id FROM public.education_modules WHERE slug = 'meeting-safely'), 2, 'Planning the First Meeting', 'article', '## Pick a Public Place

Choose a busy public place such as a café, a lively bar or a park during the day. Avoid meeting at either person''s home, or anywhere isolated, until you know each other better.

A short first meeting, like a coffee or a walk, takes pressure off both of you. You can always plan a longer second meeting.

## Get There and Back on Your Own

Arrange your own way there and back: drive, take transit or book your own ride. That way you can leave whenever you want and you do not have to share your address.

Keep your phone charged and bring a little money in case plans change.

## Tell a Friend the Plan

Before you go, tell a friend:

- who you are meeting (their name and a photo or profile)
- where and when you are meeting
- when you will message them to say you are OK

Agree what your friend will do if they do not hear from you. Sharing your live location for the evening is another option.

## Keep Some Things Private for Now

There is no rush to share your home address, exact workplace, or financial details. Trust builds over time, and it is fine to keep those for later.', 5, 'Who would you tell about a first meeting, and what would you share with them?')
ON CONFLICT (id) DO UPDATE SET module_id = EXCLUDED.module_id, section_number = EXCLUDED.section_number, title = EXCLUDED.title,
  content_text = EXCLUDED.content_text, reflection_prompt = EXCLUDED.reflection_prompt;
INSERT INTO public.module_sections (id, module_id, section_number, title, content_type, content_text, estimated_minutes, reflection_prompt)
VALUES ('7eb432ff-8164-58ce-8f55-3b97abf0b789', (SELECT id FROM public.education_modules WHERE slug = 'meeting-safely'), 3, 'During the Meeting', 'article', '## Your Drink, Your Pace

- Order your own drinks and keep them in sight.
- If you leave a drink unattended, get a fresh one.
- Go at a pace that keeps you clear-headed. Having little or nothing to drink is always fine.

If you suddenly feel much drunker than you should, or unwell, tell staff or someone you trust straight away and get help.

## Check In With Yourself

Every so often, notice how you are feeling. Relaxed and curious? Or tense, pressured or unsure?

Consent applies from the first meeting: either of you can change your mind about anything at any time. (See Consent & Sexual Autonomy for more.)

## It Is OK to Leave

You can end a meeting at any point. You do not need a big reason. Simple lines work:

- "Thanks for meeting up. I''m going to head home now."
- "I don''t think we''re a fit, but it was nice to meet you."

If someone ignores your no, follows you, or keeps pushing, go to staff or a busy area and get help. In an emergency in the US, call 911.

## Signs of Pressure

Leave, or get help, if the other person:

- keeps pushing after you say no
- tries to guilt you ("I came all this way…")
- tries to move you somewhere private quickly
- makes comments that leave you feeling unsafe', 5, 'What would you say to leave a meeting that isn''t going well?')
ON CONFLICT (id) DO UPDATE SET module_id = EXCLUDED.module_id, section_number = EXCLUDED.section_number, title = EXCLUDED.title,
  content_text = EXCLUDED.content_text, reflection_prompt = EXCLUDED.reflection_prompt;
INSERT INTO public.module_sections (id, module_id, section_number, title, content_type, content_text, estimated_minutes, reflection_prompt)
VALUES ('5a1c071d-b382-5f16-b6ef-d5e322e619b0', (SELECT id FROM public.education_modules WHERE slug = 'meeting-safely'), 4, 'After the Meeting', 'article', '## Check In With Your Friend

Send the message you agreed with your friend, even if the evening went well. It closes the loop and means they will not worry.

## Be Honest About What''s Next

If you would like to meet again, say so. If not, a short, kind message is better than disappearing:

"Thanks for meeting me. I enjoyed chatting, but I didn''t feel the connection I''m looking for. Wishing you the best."

You do not owe a long explanation. If someone reacts badly to a polite no, that tells you something.

## Block and Report

If someone pressures you, lies about who they are, asks for money, or makes you feel unsafe, you can block them and report them from your chat. Reports help keep everyone in the community safe, and you do not need to be sure before you report.

## If Something Happened

If something happened that you did not want, it is not your fault. You can get free, confidential support from RAINN''s National Sexual Assault Hotline at 1-800-656-4673, any time. In an emergency in the US, call 911.

You decide what to do next, including whether to report to the police. A trusted friend, a doctor or a support line can help you think it through.', 5, 'How do you like to tell someone you aren''t interested, kindly and clearly?')
ON CONFLICT (id) DO UPDATE SET module_id = EXCLUDED.module_id, section_number = EXCLUDED.section_number, title = EXCLUDED.title,
  content_text = EXCLUDED.content_text, reflection_prompt = EXCLUDED.reflection_prompt;
DELETE FROM public.module_sections WHERE module_id = (SELECT id FROM public.education_modules WHERE slug = 'meeting-safely') AND id <> ALL(ARRAY['a17c16fd-6a1e-5259-9692-b6b167f63bc5','5b12fe43-d858-52bc-80c5-13a7ddc657e9','7eb432ff-8164-58ce-8f55-3b97abf0b789','5a1c071d-b382-5f16-b6ef-d5e322e619b0']::uuid[]);
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('df8ff59b-6711-5834-bdbf-6491d4adcb45', (SELECT id FROM public.education_modules WHERE slug = 'meeting-safely'), 'What is the quickest way to check someone matches their photos before meeting?', '["Have a short video call","Ask for more photos","Ask for their address"]'::jsonb, 0, 0, 'multiple_choice', false, 'A few minutes on camera shows the person matches their photos.', 'A few minutes on camera shows the person matches their photos.', 'A few minutes on camera shows the person matches their photos.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('ea75f7db-17b3-59a8-afac-1fabb15fd770', (SELECT id FROM public.education_modules WHERE slug = 'meeting-safely'), 'Someone you haven''t met asks for money for an emergency. What should you do?', '["Send a small amount","Ask them to prove the emergency first","Don''t send money; this is a common sign of a scam"]'::jsonb, 2, 1, 'multiple_choice', false, 'Never send money to someone you have not met in person.', 'Never send money to someone you have not met in person.', 'Never send money to someone you have not met in person.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('0c8d4a72-6c17-55d3-862d-c4f8bf161553', (SELECT id FROM public.education_modules WHERE slug = 'meeting-safely'), 'Which first-meeting plan is safest?', '["Meeting at their home to save money","A busy café, your own transport, and a friend who knows the plan","Letting them pick you up so you don''t get lost"]'::jsonb, 1, 2, 'multiple_choice', false, 'A public place, your own way there and back, and a friend who knows the plan keep you in control.', 'A public place, your own way there and back, and a friend who knows the plan keep you in control.', 'A public place, your own way there and back, and a friend who knows the plan keep you in control.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('623778a2-9083-5f2d-a9da-3f70263f61b0', (SELECT id FROM public.education_modules WHERE slug = 'meeting-safely'), 'You leave your drink at the table to use the restroom. What should you do when you come back?', '["Finish it quickly","Ask your date if anyone touched it","Get a fresh drink"]'::jsonb, 2, 3, 'multiple_choice', false, 'If a drink has been out of your sight, get a new one.', 'If a drink has been out of your sight, get a new one.', 'If a drink has been out of your sight, get a new one.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('4bd6aab8-1690-550f-8f36-2d13c915ab33', (SELECT id FROM public.education_modules WHERE slug = 'meeting-safely'), 'Your date keeps pushing after you''ve said no. What does the lesson suggest?', '["Leave, and go to staff or a busy area for help if needed","Explain your reasons again until they understand","Give in a little to keep the peace"]'::jsonb, 0, 4, 'multiple_choice', false, 'Pushing past a no is a sign to leave. Get help if you need it.', 'Pushing past a no is a sign to leave. Get help if you need it.', 'Pushing past a no is a sign to leave. Get help if you need it.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES ('ccb998fc-71ef-5313-b33c-2d6dae379707', (SELECT id FROM public.education_modules WHERE slug = 'meeting-safely'), 'After a meeting you''re not interested. What is the best next step?', '["Disappear without a word","Send a short, kind message saying so","Agree to meet again to be polite"]'::jsonb, 1, 5, 'multiple_choice', false, 'A short, honest message is kinder and clearer than silence.', 'A short, honest message is kinder and clearer than silence.', 'A short, honest message is kinder and clearer than silence.')
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;
DELETE FROM public.quiz_questions WHERE module_id = (SELECT id FROM public.education_modules WHERE slug = 'meeting-safely') AND id <> ALL(ARRAY['df8ff59b-6711-5834-bdbf-6491d4adcb45','ea75f7db-17b3-59a8-afac-1fabb15fd770','0c8d4a72-6c17-55d3-862d-c4f8bf161553','623778a2-9083-5f2d-a9da-3f70263f61b0','4bd6aab8-1690-550f-8f36-2d13c915ab33','ccb998fc-71ef-5313-b33c-2d6dae379707']::uuid[]);
COMMIT;
