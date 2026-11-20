import { test, expect } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { buildLessonCards, type LessonCheck, type LessonSection } from "../src/lib/lessonCards";
import { guideManifest } from "../src/lib/guideRotation";

// The loader in src/lib/lessonEnhancements.ts uses Vite globs, so the files are read directly here.
const dir = "src/content/lessons";
type Extras = { hero: { art: string }; mnemonic?: { word: string }; concepts: { heading: string; art: string; size?: number[]; alt: string; letter?: string }[]; checks: LessonCheck[] };
const modules = readdirSync(dir).filter(file => file.endsWith(".json")).map(file => [file, JSON.parse(readFileSync(`${dir}/${file}`, "utf8")) as Record<string, Extras>] as const);
const fries = modules.find(([file]) => file === "consent-fundamentals.json")![1]["20612de7-667f-4c06-aa0c-9955d9964a70"];
const section: LessonSection = { id: "s", title: "FRIES", section_number: 1, estimated_minutes: 5, reflection_prompt: null,
  content_text: "## Intro\n\nHello there.\n\n### Freely Given\nOne.\n\n### Reversible\nTwo.\n\n### Informed\nThree.\n\n### Enthusiastic\nFour.\n\n### Specific\nFive.\n\n### Why This Matters\n\nSix." };

test("lessons without extras build exactly as before", () => {
  expect(buildLessonCards(section).some(card => card.type === "practice")).toBe(false);
});
test("recall questions follow the block they name and never replace lesson text", () => {
  const cards = buildLessonCards(section, [], fries.checks);
  expect(cards.filter(card => card.type !== "practice")).toEqual(buildLessonCards(section));
  const practice = cards.flatMap((card, i) => card.type === "practice" ? [i] : []);
  expect(practice.length).toBe(2);
  expect(cards[practice[0] - 1]).toMatchObject({ type: "content", title: "Informed" });
  expect(cards[practice[1] - 1]).toMatchObject({ type: "content", title: "Specific" });
});
test("every picture, answer and memory aid in every module file is real", () => {
  expect(modules.length).toBeGreaterThan(0);
  const picture = (art: string) => art === "" || guideManifest[`${art}.webp`] !== undefined || existsSync(`src/assets/lessons/${art}`);
  const ids = new Set<string>();
  for (const [file, lessons] of modules) for (const [sectionId, extras] of Object.entries(lessons)) {
    const where = `${file} ${sectionId}`;
    expect(picture(extras.hero.art), where).toBe(true);
    const headings = extras.concepts.map(concept => concept.heading);
    for (const concept of extras.concepts) {
      expect(picture(concept.art), `${where} ${concept.art}`).toBe(true);
      // An illustration carries meaning, so it needs its size (no layout shift) and a description.
      if (concept.art.endsWith(".webp")) { expect(concept.size?.length, where).toBe(2); expect(concept.alt.length, where).toBeGreaterThan(10); }
    }
    for (const check of extras.checks) {
      expect(ids.has(check.id), `${where} duplicate ${check.id}`).toBe(false); ids.add(check.id);
      expect(headings, where).toContain(check.after);
      expect(check.options.length, where).toBe(3);
      expect(check.options[check.answer], where).toBeDefined();
      expect(new Set(check.options).size, where).toBe(3);
      expect(check.explanation.length, where).toBeGreaterThan(20);
    }
    if (extras.mnemonic) expect(extras.concepts.filter(concept => concept.letter).map(concept => concept.letter).join(""), where).toBe(extras.mnemonic.word);
  }
});
