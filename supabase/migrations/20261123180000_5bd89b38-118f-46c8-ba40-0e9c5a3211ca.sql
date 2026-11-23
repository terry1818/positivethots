-- CNM Foundations is a required part of the Identity tier (owner's decision, 23 November 2026).
-- The gate for later tiers only counts required Foundation modules, so this does not lock anything.
update public.education_modules set is_required = true, is_optional = false
where slug = 'enm-principles' and tier = 'identity' and is_required = false;
