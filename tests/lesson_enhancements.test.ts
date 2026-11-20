import { test, expect } from "bun:test";
import { buildLessonCards, type LessonSection } from "../src/lib/lessonCards";
import { enhancementFor, splitLead } from "../src/lib/lessonEnhancements";
import { guideManifest } from "../src/lib/guideRotation";

const fries = "20612de7-667f-4c06-aa0c-9955d9964a70";
const section: LessonSection = { id: fries, title: "FRIES", section_number: 1, estimated_minutes: 5, reflection_prompt: null,
  content_text: "## Intro\n\nHello there.\n\n### Freely Given\nOne.\n\n### Reversible\nTwo.\n\n### Informed\nThree.\n\n### Enthusiastic\nFour.\n\n### Specific\nFive.\n\n### Why This Matters\n\nSix." };

test("lessons without extras build exactly as before", () => {
  expect(enhancementFor("unknown")).toBeNull();
  expect(buildLessonCards(section).some(card => card.type === "practice")).toBe(false);
});
test("recall questions follow the block they name and never replace lesson text", () => {
  const extras = enhancementFor(fries)!;
  const cards = buildLessonCards(section, [], extras.checks);
  const plain = buildLessonCards(section);
  expect(cards.filter(card => card.type !== "practice")).toEqual(plain);
  const practice = cards.flatMap((card, i) => card.type === "practice" ? [i] : []);
  expect(practice.length).toBe(2);
  expect(cards[practice[0] - 1]).toMatchObject({ type: "content", title: "Informed" });
  expect(cards[practice[1] - 1]).toMatchObject({ type: "content", title: "Specific" });
});
test("every picture and answer in the extras is real", () => {
  const extras = enhancementFor(fries)!;
  for (const art of [extras.hero.art, ...extras.concepts.map(concept => concept.art)]) expect(guideManifest[`${art}.webp`]).toBeDefined();
  for (const check of extras.checks) { expect(check.options[check.answer]).toBeDefined(); expect(check.explanation.startsWith(check.options[check.answer].split(" ")[0])).toBe(true); }
  expect(extras.concepts.filter(concept => concept.letter).map(concept => concept.letter).join("")).toBe(extras.mnemonic!.word);
});
test("the lead sentence is lifted out without changing a character", () => {
  const body = "Look for a genuine, excited \"yes\" — not just the absence of \"no.\" Enthusiasm can look different.\n\nSecond paragraph.";
  const parts = splitLead(body)!;
  expect(parts.lead).toBe("Look for a genuine, excited \"yes\" — not just the absence of \"no.\"");
  expect(`${parts.lead} ${parts.rest}`).toBe(body);
  expect(splitLead("- a list item. Another.")).toBeNull();
  expect(splitLead("If someone feels they *have to. Say yes* then no.")).toBeNull();
});
