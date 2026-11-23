-- Foundation is the required tier, so every module in it has to apply to every member.
-- Digital Consent & Boundaries replaces CNM Foundations as a required Foundation module.
-- CNM Foundations becomes an optional Identity module, shown directly before Relationship Orientations
-- (which already lists it as a prerequisite). Each statement is guarded by the current value, so
-- running this twice, or after a manual change in the admin screen, changes nothing.

-- Foundation order: Consent (1), Boundaries & NVC (2), Digital Consent & Boundaries (3),
-- Sexual Health & Harm Reduction (4), Emotional Intelligence & Self-Regulation (5).
update public.education_modules set order_index = 2
where slug = 'boundaries-communication' and tier = 'foundation' and order_index = 3;

update public.education_modules set tier = 'foundation', is_required = true, is_optional = false, order_index = 3
where slug = 'digital-consent-boundaries' and tier = 'sexual_health';

-- Identity order: ..., Gender Identity & Expression (11), CNM Foundations (12),
-- Relationship Orientations (13), Intersectionality in Intimacy (14), ...
update public.education_modules set order_index = 14
where slug = 'intersectionality-intimacy' and tier = 'identity' and order_index = 13;

update public.education_modules set order_index = 13
where slug = 'relationship-orientations' and tier = 'identity' and order_index = 12;

update public.education_modules set tier = 'identity', is_required = false, is_optional = true, order_index = 12
where slug = 'enm-principles' and tier = 'foundation';

-- Modules for everyone must not stay locked behind an optional non-monogamy module.
update public.education_modules set prerequisite_badges = array_remove(prerequisite_badges, 'enm-principles')
where slug in ('jealousy-insecurity', 'new-monogamy-redesigning-relationships')
  and 'enm-principles' = any(prerequisite_badges);
