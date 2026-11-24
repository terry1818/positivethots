import { test, expect } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
// @ts-expect-error plain JS build script
import { parseCourse, buildSql, buildVisuals, uuid5 } from "../scripts/course.mjs";
import { SECTION_IDS } from "../src/lib/learnSections";

// Courses written in content/courses/<slug>.md are built by scripts/course.mjs. These tests keep the built
// files in step with the source and catch mistakes before anything reaches the database.

const slugs = existsSync("content/courses") ? readdirSync("content/courses").filter(f => f.endsWith(".md")).map(f => f.slice(0, -3)) : [];
const guides = new Set(readdirSync("src/assets/guides").map(f => f.replace(/\.webp$/, "")));
const banned = [/\bswip/i, /\bsuper ?like/i, /it'?s a match/i, /\bdating app\b/i, /\bstripe\b/i];

test("course ids never change for the same slug and lesson", () => {
  expect(uuid5("meeting-safely:lesson:1")).toBe("a17c16fd-6a1e-5259-9692-b6b167f63bc5");
});

for (const slug of slugs) {
  const src = readFileSync(`content/courses/${slug}.md`, "utf8");
  const course = parseCourse(src, slug);

  test(`${slug}: built files match the source (run node scripts/course.mjs ${slug})`, () => {
    expect(readFileSync(`supabase/courses/${slug}.sql`, "utf8")).toBe(buildSql(course));
    expect(readFileSync(`src/content/lessons/${slug}.json`, "utf8")).toBe(buildVisuals(course));
  });

  test(`${slug}: section, pictures and wording are valid`, () => {
    expect(course.slug).toBe(slug);
    expect(SECTION_IDS).toContain(course.section);
    for (const l of course.lessons) {
      for (const art of [l.hero, ...l.blocks.map((b: { art: string }) => b.art)]) {
        if (!art) continue;
        if (art.startsWith("guide-")) expect(guides.has(art)).toBe(true);
        else expect(existsSync(`src/assets/lessons/${art}`)).toBe(true);
      }
    }
    for (const rx of banned) expect(src).not.toMatch(rx);
  });

  test(`${slug}: every question has one right answer that is not always in the same place`, () => {
    const all = [...course.quiz, ...course.lessons.flatMap((l: { checks: unknown[] }) => l.checks)] as { options: string[]; answer: number }[];
    for (const q of all) {
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.answer).toBeGreaterThanOrEqual(0);
    }
    expect(new Set(all.map(q => q.answer)).size).toBeGreaterThan(1);
  });
}
