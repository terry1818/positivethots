-- Corrects seven graded quiz questions whose wording relied on figures or attributions that were wrong
-- in the lesson text (see src/content/lesson-text and docs/lesson-text-corrections.md).
-- Each update only runs while the question still has its original wording, so an edit made in the
-- admin quiz editor is never overwritten. The position of the correct answer is unchanged everywhere.

update public.quiz_questions set
  question = $q$According to the lesson, why is it worth talking about technology expectations early in a relationship?$q$,
  options = $j$["It guarantees you will get engaged sooner.", "It prevents a lot of avoidable conflict about digital behavior.", "It makes social media unnecessary.", "It removes the need for any other boundaries."]$j$::jsonb
where id = 'd549f328-b307-4744-bd57-34bb66f11611'
  and question = $q$According to the Gottman Institute research mentioned, what is a key benefit for couples who discuss technology expectations early in their relationship?$q$;

update public.quiz_questions set
  question = $q$According to the HeartMath Institute, how does the heart's magnetic field compare to the brain's?$q$,
  options = $j$["They are equal in strength", "The brain's is stronger", "The heart's is much stronger (about 100 times, by HeartMath's current figure)", "The heart doesn't generate a field"]$j$::jsonb
where id = '7a3e342b-e195-42fa-a1b0-c7794cfc69dc'
  and question = $q$According to HeartMath Institute research, how does the heart's electromagnetic field compare to the brain's?$q$;

update public.quiz_questions set
  question = $q$A 2013 study compared 902 kink practitioners with 434 other adults (Wismeijer & van Assen). On average, the practitioners were...$q$,
  options = $j$["Higher in psychological distress", "Less neurotic, more open to new experiences and higher in wellbeing", "Lower in emotional awareness", "More likely to have relationship conflicts"]$j$::jsonb,
  explanation_correct = $e$Yes. In that study, kink practitioners were on average less neurotic, more open to new experiences and higher in wellbeing than the comparison group, which counters the old idea that kink signals poor mental health.$e$,
  explanation_wrong = $e$In the 2013 study by Wismeijer & van Assen, kink practitioners were on average less neurotic, more open to new experiences and higher in wellbeing than the comparison group. Kink is not a sign of poor mental health.$e$
where id = '06f37a9d-269e-49e2-af1b-fc173a14d02b'
  and question = $q$Dr. David Ley's research on kink practitioners found that they generally demonstrate...$q$;

update public.quiz_questions set
  question = $q$According to John Gottman's research, what ratio of positive to negative interactions do stable, happy couples keep during conflict?$q$
where id = '24ed0baa-8894-4c0b-aa2d-78cba339ce42'
  and question = $q$According to John Gottman's 40+ years of research, what positive-to-negative interaction ratio predicts 94% relationship survival?$q$;

update public.quiz_questions set
  question = $q$In Carol Dweck's research on praise, which children did better on later, harder problems?$q$,
  options = $j$["Those praised for being smart", "Both groups did the same", "Those praised for their effort", "Those who were given no feedback at all"]$j$::jsonb
where id = '2b00fefb-6771-4959-a62c-62cf5050b078'
  and question = $q$Carol Dweck's research found that students praised for effort outperformed those praised for intelligence by what percentage on subsequent challenges?$q$;

update public.quiz_questions set
  options = $j$["As proven fact", "As unproven frontier research that has not been independently replicated and is not accepted by mainstream science", "As universally accepted mainstream science", "As irrelevant"]$j$::jsonb
where id = '5aaef102-e5b5-4af5-9e24-a7c47922df95'
  and question = $q$How does the module categorize intention research by Dean Radin et al.?$q$
  and options->>1 = $o$As frontier science—intriguing and statistically significant, but mechanisms not yet understood$o$;

update public.quiz_questions set
  explanation_correct = $e$Yes. PrEP (Pre-Exposure Prophylaxis) is preventive medication: a daily pill, an injection every two months, or an injection every six months. Taken as prescribed, it reduces the risk of getting HIV from sex by about 99%.$e$
where id = '2a723832-58af-4985-a27a-840b17b563bd'
  and explanation_correct = $e$Yes — PrEP (Pre-Exposure Prophylaxis) is a preventive medication taken daily or as an injection every two months that reduces HIV risk by approximately 99% when used as prescribed.$e$;
