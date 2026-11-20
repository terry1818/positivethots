import { test, expect } from "bun:test";
import { lessonEntry, levelNodes, reviewSourceId } from "../src/lib/learnLevels";
const sections = [1,2,3,4].map(n => ({ id: `${n}`, module_id: "m", section_number: n, title: `Section ${n}` }));
test("new level has four lessons and a locked badge check, with only Lesson 1 current", () => {
  const nodes = levelNodes(sections, new Set(), false, true);
  expect(nodes.length).toBe(5); expect(nodes.filter(n => n.current).map(n => n.section)).toEqual([1]);
  expect(nodes[4].unlocked).toBe(false);
});
test("completing Lesson 1 moves current to Lesson 2", () => {
  const nodes = levelNodes(sections, new Set(["1"]), false, true);
  expect(nodes[0].done).toBe(true); expect(nodes.filter(n => n.current).map(n => n.section)).toEqual([2]);
});
test("section 3 opens only after earlier lessons; invalid values fall back to first incomplete", () => {
  expect(lessonEntry(sections, new Set(["1","2"]), "3", null).index).toBe(2);
  expect(lessonEntry(sections, new Set(["1"]), "3", null).index).toBe(1);
  expect(lessonEntry(sections, new Set(["1"]), "-1", null).index).toBe(1);
});
test("quiz link requires all four completed lessons", () => {
  expect(lessonEntry(sections, new Set(["1","2","3","4"]), null, "1").quiz).toBe(true);
  expect(lessonEntry(sections, new Set(["1"]), null, "1")).toEqual({ index: 1, quiz: false, blockedQuiz: true });
});
test("review uses the existing per-tier UTC daily source key", () => {
  expect(reviewSourceId("foundation", new Date("2026-11-20T23:59:59Z"))).toBe("foundation:2026-11-20");
  expect(reviewSourceId("foundation", new Date("2026-11-21T00:00:00Z"))).toBe("foundation:2026-11-21");
});