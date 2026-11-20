import { test, expect } from "bun:test";
import { finishSteps, completedNodeId, type FinishData } from "../src/lib/learnFinish";
const base: FinishData = { kind: "lesson", moduleId: "m", node: "lesson-1", title: "Consent", slug: "consent", tier: "foundation", xp: 10, oldXP: 90 };
test("first lesson includes streak, second does not", () => {
  expect(finishSteps({ ...base, firstLessonToday: true, streak: 3 })).toEqual(["lesson", "streak"]);
  expect(finishSteps({ ...base, firstLessonToday: false })).toEqual(["lesson"]);
});
test("lesson finish never exceeds three steps", () => expect(finishSteps({ ...base, firstLessonToday: true, level: 2 })).toEqual(["lesson", "streak", "level"]));
test("new badge orders reward, results, level, tier in four steps", () => expect(finishSteps({ ...base, kind: "badge", level: 2, tierComplete: true })).toEqual(["badge", "results", "level", "tier"]));
test("earned badge and tier reviews suppress all celebration steps", () => expect(finishSteps({ ...base, kind: "review", xp: 0, level: 2, tierComplete: true })).toEqual(["review"]));
test("return selects the actual completed section or badge", () => {
  expect(completedNodeId(base, [{ id: "s", module_id: "m", section_number: 1 }])).toBe("s");
  expect(completedNodeId({ ...base, node: "badge" }, [])).toBe("quiz:m");
});