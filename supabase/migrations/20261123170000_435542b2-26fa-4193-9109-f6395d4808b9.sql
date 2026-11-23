-- Follow-up to 20261123160000 (owner's decisions, 23 November 2026). Every statement is guarded.

-- 1. Jealousy & Insecurity and The New Monogamy keep CNM Foundations as a prerequisite (restores the original lists).
update public.education_modules set prerequisite_badges = array_append(prerequisite_badges, 'enm-principles')
where slug = 'jealousy-insecurity' and not ('enm-principles' = any(prerequisite_badges));

update public.education_modules set prerequisite_badges = array_prepend('enm-principles', prerequisite_badges)
where slug = 'new-monogamy-redesigning-relationships' and not ('enm-principles' = any(prerequisite_badges));

-- 2. CNM Foundations is a full part of the Identity tier, not an optional extra. is_required stays false:
--    that flag gates the whole path and only Foundation modules may carry it.
update public.education_modules set is_optional = false
where slug = 'enm-principles' and tier = 'identity' and is_optional is distinct from false;

-- 3. Accounts that had already finished Foundation as it stood before the swap (the four modules that stayed
--    plus CNM Foundations) keep their access: they receive the Digital Consent & Boundaries badge.
--    quiz_score is left empty and attempt_count is 0 because no quiz was taken.
insert into public.user_badges (user_id, module_id, quiz_score, attempt_count)
select u.user_id, d.id, null, 0
from (
  select b.user_id
  from public.user_badges b
  join public.education_modules m on m.id = b.module_id
  where m.slug in ('consent-fundamentals', 'boundaries-communication', 'safer-sex', 'emotional-responsibility', 'enm-principles')
  group by b.user_id
  having count(distinct m.slug) = 5
) u
cross join (select id from public.education_modules where slug = 'digital-consent-boundaries') d
where not exists (select 1 from public.user_badges x where x.user_id = u.user_id and x.module_id = d.id);
