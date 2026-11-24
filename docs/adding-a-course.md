# Adding a course

A course is one source file. A script turns it into the database SQL and the lesson pictures and checks.

## 1. Check the curriculum map

Open `docs/curriculum-map.md`. If a topic already has a home lesson, point to it instead of teaching it again.
Add the new course's topics to the map when you finish.

## 2. Write `content/courses/<slug>.md`

```
---
slug: meeting-safely                 # unique, kebab-case, never change it after publishing
title: Meeting Someone Safely the First Time
section: dating_safety               # an id from src/lib/learnSections.ts
order: 1                             # position inside the section
badge: 30                            # badge number shown on the badge (next free number)
minutes: 20
prereq: consent-fundamentals         # comma-separated module slugs, or leave empty
required: false                      # true only for Foundation
description: One or two sentences shown on the module card.
---

# Lesson: Before You Meet
hero: guide-thinking                 # guide picture at the top (src/assets/guides, no .webp)
reflection: Journal question shown at the end of the lesson.
takeaway: One line to remember.
mnemonic: FRIES | Caption for the memory aid (optional; each card then needs letter: F, R, ...)

## A heading (one card)
art: guide-study-together            # or <folder>/<file>.webp under src/assets/lessons
plain: The card's "In plain words" line (20-150 characters).

Markdown body: paragraphs, - bullets, **bold**.

check: A quick check question (exactly 3 options) after this card?
- wrong option
- *right option (mark with *)
- wrong option
> Explanation shown after answering.

# Quiz
? Badge quiz question (at least 5)
- option
- *right option
> Explanation.
```

Rules: each lesson needs at least 2 `##` cards; vary which option is right; use branded words (Connect, Pass,
Send a Thot, You Both Said Yes); never "swipe", "like", "match" or "dating app"; write for everyone.

## 3. Build and test

```bash
node scripts/course.mjs <slug>        # writes supabase/courses/<slug>.sql and src/content/lessons/<slug>.json
bun test tests/courses.test.ts
```

Preview it: add the module and its lessons to the preview fixtures and open `/learn/<slug>`.

## 4. Put it live

1. Push first, then run `supabase/courses/<slug>.sql` against the database. It is safe to run again after edits.
   Quickest from Lovable `query_database` (no pasting): fetch it from GitHub with pg_net, check the md5 against
   the local file, then run it:
   `SELECT net.http_get('https://raw.githubusercontent.com/terry1818/positivethots/<commit>/supabase/courses/<slug>.sql');`
   then `DO $$ ... EXECUTE replace(replace(content, E'\nBEGIN;\n', E'\n'), E'\nCOMMIT;\n', E'\n') ... $$` over `net._http_response`.
2. `node scripts/course.mjs <slug> --migration` saves a timestamped copy under `supabase/migrations/` for the record.
3. Commit, push, then Publish → Update in Lovable.

## A new section

Add one entry to `LEARN_SECTIONS` in `src/lib/learnSections.ts` (name, guide picture, colour, `plan`), add its
`--path-<name>-*` colours and `.learn-tier-<id>` rules in `src/index.css` (white text needs 4.5:1), and run
`bun test tests/learn_sections.test.ts`. A section stays hidden until it has a module.
