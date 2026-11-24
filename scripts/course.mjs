#!/usr/bin/env node
// Builds a Learn course from one source file: content/courses/<slug>.md
//
//   node scripts/course.mjs <slug>              writes supabase/courses/<slug>.sql and src/content/lessons/<slug>.json
//   node scripts/course.mjs <slug> --migration  also copies the SQL into a new timestamped migration
//   node scripts/course.mjs --check             fails if any built file is out of date (used by the tests)
//
// The SQL is safe to run more than once. Ids are derived from the slug and lesson number, so editing a
// course and rebuilding updates the same rows. See docs/adding-a-course.md for the source format.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

const NS = "6f3c2b1a-9d84-4e57-a2c1-5b7e0f4d8c39"; // fixed namespace for course ids

export function uuid5(name) {
  const ns = Buffer.from(NS.replace(/-/g, ""), "hex");
  const h = createHash("sha1").update(Buffer.concat([ns, Buffer.from(name, "utf8")])).digest();
  h[6] = (h[6] & 0x0f) | 0x50; h[8] = (h[8] & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString("hex");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

/** Reads "- option" / "- *correct option" lines and a "> explanation" line into a question. */
function readOptions(lines, where) {
  const options = []; let answer = -1; let explanation = "";
  for (const l of lines) {
    const opt = l.match(/^- (\*)?(.+)$/);
    if (opt) { if (opt[1]) answer = options.length; options.push(opt[2].trim()); continue; }
    const ex = l.match(/^> (.+)$/);
    if (ex) { explanation += (explanation ? " " : "") + ex[1].trim(); continue; }
    if (l.trim()) throw new Error(`${where}: unexpected line in a question: ${l}`);
  }
  if (options.length < 2) throw new Error(`${where}: a question needs at least 2 options`);
  if (answer < 0) throw new Error(`${where}: mark the right option with "- *"`);
  if (!explanation) throw new Error(`${where}: add an explanation line starting with "> "`);
  return { options, answer, explanation };
}

export function parseCourse(src, file = "course") {
  const fm = src.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) throw new Error(`${file}: missing front matter`);
  const meta = {};
  for (const l of fm[1].split("\n")) {
    const m = l.match(/^(\w+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].replace(/\s+#\s.*$/, "").trim();
  }
  for (const k of ["slug", "title", "section", "order", "badge", "description"]) if (!meta[k]) throw new Error(`${file}: front matter needs ${k}`);
  const course = {
    slug: meta.slug, title: meta.title, section: meta.section, order: Number(meta.order), badge: Number(meta.badge),
    minutes: Number(meta.minutes || 20), description: meta.description,
    prereq: (meta.prereq || "").split(",").map(s => s.trim()).filter(Boolean),
    required: meta.required === "true", lessons: [], quiz: [],
  };
  const body = src.slice(fm[0].length).replace(/\r\n/g, "\n");
  const parts = body.split(/^# /m).filter(p => p.trim());
  for (const part of parts) {
    const [head, ...rest] = part.split("\n");
    if (/^Quiz\s*$/.test(head)) {
      for (const q of rest.join("\n").split(/^\? /m).slice(1)) {
        const [prompt, ...ql] = q.split("\n");
        course.quiz.push({ prompt: prompt.trim(), ...readOptions(ql, `${file} quiz "${prompt}"`) });
      }
      continue;
    }
    const lm = head.match(/^Lesson:\s*(.+)$/);
    if (!lm) throw new Error(`${file}: top-level heading must be "# Lesson: <title>" or "# Quiz", got "# ${head}"`);
    const lesson = { title: lm[1].trim(), hero: "guide-lesson-reading", reflection: "", takeaway: "", mnemonic: "", blocks: [], checks: [] };
    const where = `${file} lesson "${lesson.title}"`;
    let block = null; let check = null;
    const endCheck = () => { if (check) { lesson.checks.push({ after: check.after, prompt: check.prompt, ...readOptions(check.lines, `${where} check`) }); check = null; } };
    for (const line of rest) {
      const h = line.match(/^## (.+)$/);
      if (h) { endCheck(); block = { heading: h[1].trim(), art: "", alt: "", plain: "", letter: "", lines: [] }; lesson.blocks.push(block); continue; }
      const c = line.match(/^check:\s*(.+)$/);
      if (c) { endCheck(); if (!block) throw new Error(`${where}: a check must come after a ## heading`); check = { after: block.heading, prompt: c[1].trim(), lines: [] }; continue; }
      if (check) { check.lines.push(line); continue; }
      const kv = line.match(/^(hero|reflection|takeaway|mnemonic|art|alt|plain|letter):\s*(.+)$/);
      if (kv && (!block || ["art", "alt", "plain", "letter"].includes(kv[1]) && block.lines.every(l => !l.trim()))) {
        const v = ["hero", "art"].includes(kv[1]) ? kv[2].replace(/\s+#\s.*$/, "").trim() : kv[2].trim();
        if (!block) lesson[kv[1]] = v; else block[kv[1]] = v;
        continue;
      }
      if (!block) { if (line.trim()) throw new Error(`${where}: text before the first ## heading: ${line}`); continue; }
      block.lines.push(line);
    }
    endCheck();
    for (const k of lesson.checks) if (k.options.length !== 3) throw new Error(`${where}: check "${k.prompt}" needs exactly 3 options`);
    if (lesson.mnemonic) {
      const [word, caption] = lesson.mnemonic.split("|").map(x => x.trim());
      if (!caption || lesson.blocks.map(b => b.letter).join("") !== word) throw new Error(`${where}: mnemonic must be "WORD | caption" and the cards' letter: lines must spell WORD`);
      lesson.mnemonic = { word, caption };
    }
    if (lesson.blocks.length < 2) throw new Error(`${where}: a lesson needs at least 2 ## blocks`);
    course.lessons.push(lesson);
  }
  if (course.lessons.length < 2) throw new Error(`${file}: a course needs at least 2 lessons`);
  if (course.quiz.length < 5) throw new Error(`${file}: the badge quiz needs at least 5 questions`);
  return course;
}

const sq = s => `'${String(s).replace(/'/g, "''")}'`;
const arr = a => `ARRAY[${a.map(sq).join(",")}]::text[]`;
const ids = (c) => ({
  section: i => uuid5(`${c.slug}:lesson:${i + 1}`),
  quiz: i => uuid5(`${c.slug}:quiz:${i + 1}`),
});

export function lessonText(lesson) {
  return lesson.blocks.map(b => `## ${b.heading}\n\n${b.lines.join("\n").trim()}`).join("\n\n");
}

export function buildSql(c) {
  const id = ids(c); const mod = `(SELECT id FROM public.education_modules WHERE slug = ${sq(c.slug)})`;
  const out = [`-- Course "${c.title}". Built by scripts/course.mjs from content/courses/${c.slug}.md. Do not edit by hand.`, "BEGIN;"];
  out.push(`INSERT INTO public.education_modules (slug, title, description, content, tier, order_index, badge_number, estimated_minutes, prerequisite_badges, is_required, is_optional)
VALUES (${sq(c.slug)}, ${sq(c.title)}, ${sq(c.description)}, ${sq(c.description)}, ${sq(c.section)}, ${c.order}, ${c.badge}, ${c.minutes}, ${arr(c.prereq)}, ${c.required}, ${!c.required})
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, content = EXCLUDED.content, tier = EXCLUDED.tier,
  order_index = EXCLUDED.order_index, badge_number = EXCLUDED.badge_number, estimated_minutes = EXCLUDED.estimated_minutes,
  prerequisite_badges = EXCLUDED.prerequisite_badges, is_required = EXCLUDED.is_required, is_optional = EXCLUDED.is_optional;`);
  c.lessons.forEach((l, i) => {
    out.push(`INSERT INTO public.module_sections (id, module_id, section_number, title, content_type, content_text, estimated_minutes, reflection_prompt)
VALUES (${sq(id.section(i))}, ${mod}, ${i + 1}, ${sq(l.title)}, 'article', ${sq(lessonText(l))}, 5, ${l.reflection ? sq(l.reflection) : "NULL"})
ON CONFLICT (id) DO UPDATE SET module_id = EXCLUDED.module_id, section_number = EXCLUDED.section_number, title = EXCLUDED.title,
  content_text = EXCLUDED.content_text, reflection_prompt = EXCLUDED.reflection_prompt;`);
  });
  out.push(`DELETE FROM public.module_sections WHERE module_id = ${mod} AND id <> ALL(ARRAY[${c.lessons.map((_, i) => sq(id.section(i))).join(",")}]::uuid[]);`);
  c.quiz.forEach((q, i) => {
    out.push(`INSERT INTO public.quiz_questions (id, module_id, question, options, correct_answer, order_index, exercise_type, is_checkpoint, explanation, explanation_correct, explanation_wrong)
VALUES (${sq(id.quiz(i))}, ${mod}, ${sq(q.prompt)}, ${sq(JSON.stringify(q.options))}::jsonb, ${q.answer}, ${i}, 'multiple_choice', false, ${sq(q.explanation)}, ${sq(q.explanation)}, ${sq(q.explanation)})
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
  order_index = EXCLUDED.order_index, explanation = EXCLUDED.explanation, explanation_correct = EXCLUDED.explanation_correct, explanation_wrong = EXCLUDED.explanation_wrong;`);
  });
  out.push(`DELETE FROM public.quiz_questions WHERE module_id = ${mod} AND id <> ALL(ARRAY[${c.quiz.map((_, i) => sq(id.quiz(i))).join(",")}]::uuid[]);`);
  out.push("COMMIT;", "");
  return out.join("\n");
}

export function buildVisuals(c) {
  const id = ids(c); const out = {};
  c.lessons.forEach((l, i) => {
    const sid = id.section(i);
    const entry = {
      hero: { art: l.hero, alt: "" },
      concepts: l.blocks.map(b => ({ heading: b.heading, art: b.art || "guide-lesson-reading", alt: b.alt || "", ...(b.plain ? { plain: b.plain } : {}), ...(b.letter ? { letter: b.letter } : {}) })),
      checks: l.checks.map((k, n) => ({ id: `${sid.slice(0, 8)}-${n + 1}`, after: k.after, prompt: k.prompt, options: k.options, answer: k.answer, explanation: k.explanation })),
    };
    if (l.takeaway) entry.takeaway = l.takeaway;
    if (l.mnemonic) entry.mnemonic = l.mnemonic;
    out[sid] = entry;
  });
  return JSON.stringify(out, null, 1) + "\n";
}

function build(slug, write) {
  const file = `content/courses/${slug}.md`;
  const c = parseCourse(readFileSync(file, "utf8"), file);
  if (c.slug !== slug) throw new Error(`${file}: slug in front matter must be ${slug}`);
  const files = { [`supabase/courses/${slug}.sql`]: buildSql(c), [`src/content/lessons/${slug}.json`]: buildVisuals(c) };
  const stale = [];
  for (const [p, text] of Object.entries(files)) {
    if (write) { mkdirSync(p.replace(/\/[^/]+$/, ""), { recursive: true }); writeFileSync(p, text); }
    else if (!existsSync(p) || readFileSync(p, "utf8") !== text) stale.push(p);
  }
  return { c, files, stale };
}

if (import.meta.main ?? process.argv[1]?.endsWith("course.mjs")) {
  const [arg, flag] = process.argv.slice(2);
  if (arg === "--check") {
    const slugs = existsSync("content/courses") ? readdirSync("content/courses").filter(f => f.endsWith(".md")).map(f => f.slice(0, -3)) : [];
    const stale = slugs.flatMap(s => build(s, false).stale);
    if (stale.length) { console.error("Out of date, run node scripts/course.mjs <slug>:\n" + stale.join("\n")); process.exit(1); }
    console.log(`${slugs.length} course(s) up to date`);
  } else if (arg) {
    const { c, files } = build(arg, true);
    console.log(`${c.title}: ${c.lessons.length} lessons, ${c.lessons.reduce((n, l) => n + l.checks.length, 0)} checks, ${c.quiz.length} quiz questions`);
    for (const p of Object.keys(files)) console.log("wrote " + p);
    if (flag === "--migration") {
      const ts = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
      const p = `supabase/migrations/${ts}_course_${arg.replace(/-/g, "_")}.sql`;
      writeFileSync(p, files[`supabase/courses/${arg}.sql`]);
      console.log("wrote " + p);
    }
  } else {
    console.error("usage: node scripts/course.mjs <slug> [--migration] | --check"); process.exit(1);
  }
}
