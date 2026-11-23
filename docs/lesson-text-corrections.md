# Lesson text corrections (November 2026)

The lesson text is stored in the database (`module_sections`). The corrections below ship in the repo and
replace the stored text on screen, lesson by lesson, only while the stored text is still the version each
correction was written against. Editing a lesson in the admin editor switches that lesson back to whatever
the editor saved.

- `src/content/lesson-text/index.json`: lessons with a correction, and corrected lesson titles.
- `src/content/lesson-text/modules/<module-slug>.json`: the corrected text, loaded when the module opens.
- `src/lib/lessonText.ts` / `lessonTextCore.ts`: the loader and the matching rule.
- `tests/lesson_text.test.ts`: file checks, and that every picture and recall question still matches a card.

## Rules the corrected text follows

1. **Every lesson ends with something to do.** Lessons that had no exercise end with `## Try It Tonight`:
   one action that takes ten minutes or less and works whether the reader is single, dating or partnered.
2. **Help is one tap away.** Lessons about coercion, violations, harassment, image abuse, trauma, crisis,
   grief, toxic cycles, financial abuse and gender or orientation distress end with `## If You Need Help Now`
   (United States numbers; a line for readers elsewhere; a device-safety line where a partner may be the risk).
3. **Everyone is the audience.** Sections that only addressed people with several partners now open with
   "If you're single or dating" and "If you have one partner", then keep the original multi-partner text.
   The three modules whose subject is consensual non-monogamy keep that subject.
4. **No statistic without a checked source.** Figures that could not be traced were removed or replaced with
   the finding in words. Figures that were wrong were corrected.
5. **Claims are labelled for what they are.** The Divine Matrix module separates established findings
   (emotional contagion, the calming effect of slow breathing) from debated ones (mirror neurons and empathy,
   HeartMath's field claims) and from ideas mainstream science does not accept (intention changing matter,
   quantum physics applied to relationships), which are presented as metaphor.
6. **Later lessons point back.** Where a topic returns (new relationship energy, attachment, hierarchy,
   rules and agreements, bids, the nervous system) the later section opens with a "Building on earlier lessons" line.

## Required modules

Foundation is the tier every member completes before connecting, so its modules have to apply to everyone.
From the migration `20261123160000_*`: Consent & Sexual Autonomy, Boundaries & NVC, Digital Consent &
Boundaries, Sexual Health & Harm Reduction, Emotional Intelligence & Self-Regulation. CNM Foundations is an
Identity module, shown before Relationship Orientations, and counts toward the Identity tier and its rewards.
Jealousy & Insecurity and The New Monogamy still need the CNM Foundations badge (`20261123170000_*`).
Accounts that had finished Foundation as it stood before the change were given the Digital Consent &
Boundaries badge so they did not lose access.

## Facts corrected, with the source used

| Was | Now | Source |
|---|---|---|
| 1% a day makes you "37x better" by day 66 | about 1.9x by day 66, 37x after a year | arithmetic (1.01^66, 1.01^365) |
| Yue & Cole, Cleveland Clinic, 13.5% | University of Iowa (1992): 22% imagined vs 30% physical | Yue & Cole, J. Neurophysiology 1992 |
| 98% of abusive relationships involve financial abuse | financial abuse occurs in about 99% of domestic violence cases | NNEDV |
| 5:1 ratio gives "94% relationship survival" | 5:1 describes stable couples in conflict; 94% was prediction accuracy in a 1992 study | Buehlman, Gottman & Katz 1992 |
| Dr. David Ley's "Positive Sexuality and Behavior (PSB)" findings | Wismeijer & van Assen 2013 (902 practitioners, 434 others), with its limits | J. Sexual Medicine 2013 |
| "SHA Kink-Informed Care framework", "SHA/AASECT KIC directory" | SHA's Kink Informed Certification; Kink Aware Professionals directory (NCSF) | Sexual Health Alliance; NCSF |
| Gottman "40% fewer conflicts"; 2023 study "35% higher satisfaction" | removed; technoference research cited in words | no source found; McDaniel & Coyne |
| MBSR cuts pain 65%, anxiety 58%, relapse 44%; tapping 50%; EMDR 60-80% | findings stated without the figures; EMDR as guideline-recommended | no source found for the figures; WHO guidelines |
| Brewer 40%; Goleman 90%; Dweck 30%+ | stated in words | figures not traceable |
| Gollwitzer 1999 "meta-analysis", 2-3x | Gollwitzer & Sheeran 2006 (94 studies); 91% vs 35-38% in one exercise study | Milne, Orbell & Sheeran 2002 |
| Christakis & Fowler (2009): 15%, 10%, 5% | Fowler & Christakis (2008): about 15%, 10%, 6% | BMJ 2008 |
| 36% of US counties have no OB-GYN (ACOG) | about 35% of US counties are maternity care deserts | March of Dimes 2024 |
| Mirror neurons "(2008 Nobel Prize)" | removed: there was no such prize; role in human empathy described as debated | |
| Heart field "5,000x" the brain's | about 100x by HeartMath's current figure (older publications: 5,000x); effect on others unconfirmed | HeartMath Institute |
| PrEP as a daily pill only | daily pill, cabotegravir every two months, lenacapavir every six months | FDA approval June 2025; CDC |
| no mention | doxy-PEP, HIV test window periods, vaccines | CDC 2024 doxy-PEP guidance; CDC HIV testing |

## Not yet verified

These figures are still in the lessons and were not individually re-checked: love addiction 3-6%,
15-20% neurodivergent, 40-50% insecure attachment, 70% of adults with a traumatic event, caregiver burden
40-70%, Pew 41%, NIMH 19% and 8%, contraception effectiveness percentages, Chivers' concordance figures,
Gottman's 86%/33%, 67%, 69%, 96% and "six years", Wood's 43%, Lally's 66 days, Beattie's 96 million.
A sex educator or clinician should review the sexual health lessons before launch.

## Changing a correction

The authoring scripts that produced these files are not in the repo. To change one lesson by hand, edit its
`text` in the module file and leave `was` alone. To retire a correction, delete its entry from the module file
and from `index.json`. If a lesson is edited in the admin editor, its correction stops applying; move any
wording you still want into the editor.
