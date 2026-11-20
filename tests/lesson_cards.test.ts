import { test, expect } from "bun:test";
import { buildLessonCards, resumeCardIndex, type LessonSection } from "../src/lib/lessonCards";
const section: LessonSection = { id: "s", title: "Consent", section_number: 1, estimated_minutes: 5, content_text: "Preface.\n\n## First\n\nOne idea.\n\n### Second\n\nTwo ideas.\n\n## Third\n\nThree ideas.\n\n## Fourth\n\nFour ideas.\n\n## Fifth\n\nFive ideas.\n\n## Sixth\n\nSix ideas.", reflection_prompt: "Reflect" };
const checkpoints = [1, 2].map(n => ({ id: `${n}`, question: "Question", options: ["A", "B"], position_in_section: n }));
test("normal lesson keeps preface, headings, title, takeaway and optional reflection", () => {
  const cards = buildLessonCards(section);
  expect(cards.length).toBe(10); expect(cards[0]).toMatchObject({ type: "title", lesson: 1, minutes: 5 });
  expect(cards[1]).toMatchObject({ type: "content", title: "", body: "Preface." });
  expect(cards[8].type).toBe("takeaway"); expect(cards[9].type).toBe("reflection");
});
test("700-character blocks split at paragraphs without truncating long paragraphs or lists", () => {
  const body = `${"a".repeat(450)}\n\n${"b".repeat(450)}\n\n- ${"c".repeat(800)}\n\n- ${"d".repeat(800)}`;
  const cards = buildLessonCards({ ...section, content_text: `## Heading\n\n${body}`, reflection_prompt: null }).filter(c => c.type === "content");
  expect(cards.length).toBe(3); expect(cards[1]).toMatchObject({ continued: true, title: "Heading" });
  expect(cards.map(c => "body" in c ? c.body : "").join("\n\n")).toBe(body);
});
test("no headings uses 600-character paragraph chunks", () => {
  const cards = buildLessonCards({ ...section, content_text: `${"a".repeat(350)}\n\n${"b".repeat(350)}` });
  expect(cards.filter(c => c.type === "content").length).toBe(2);
});
test("YouTube block gets its own video card without losing surrounding text", () => {
  const cards = buildLessonCards({ ...section, content_text: "## Video\n\nBefore.\n\n[youtube:Consent](https://www.youtube.com/embed/abc)\n\nAfter." });
  expect(cards.filter(c => c.type === "video").length).toBe(1);
  expect(cards.filter(c => c.type === "content").map(c => "body" in c && c.body)).toEqual(["Before.", "After."]);
});
for (const count of [0, 1, 2]) test(`${count} checkpoints appear in distinct interior content gaps`, () => {
  const cards = buildLessonCards(section, checkpoints.slice(0, count));
  const indexes = cards.flatMap((c, i) => c.type === "checkpoint" ? [i] : []);
  expect(indexes.length).toBe(count);
  for (const i of indexes) { expect(cards[i - 1].type).toBe("content"); expect(cards[i + 1].type).toBe("content"); }
  if (count === 1) expect(indexes).toEqual([3]);
  if (count === 2) expect(indexes).toEqual([3, 7]);
});
test("changed content resets invalid saved positions to title", () => {
  expect(resumeCardIndex(4, 10)).toBe(4); expect(resumeCardIndex(10, 10)).toBe(0); expect(resumeCardIndex(-1, 10)).toBe(0);
});
