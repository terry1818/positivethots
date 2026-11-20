import { test, expect } from "bun:test";
import { highlightedTodayChip, nextLearningTarget, pathOffsets, windingConnector } from "../src/lib/learnHome";

test("Today highlights only one chip in streak, bonus, spin, challenge priority", () => {
  expect(highlightedTodayChip(true, true, true, true)).toBe("streak");
  expect(highlightedTodayChip(false, true, true, true)).toBe("bonus");
  expect(highlightedTodayChip(false, false, true, true)).toBe("spin");
  expect(highlightedTodayChip(false, false, false, true)).toBe("challenge");
  expect(highlightedTodayChip(false, false, false, false)).toBeNull();
});
const modules = [{ id: "a", slug: "a", title: "A" }, { id: "b", slug: "b", title: "B" }];
test("Start chooses the first unlocked incomplete module without changing gates", () => {
  const target = nextLearningTarget(modules, new Set(), m => m.id === "a", {}, []);
  expect(target?.module.id).toBe("a");
  expect(target?.started).toBe(false);
  expect(target?.section).toBe(1);
  expect(nextLearningTarget(modules, new Set(), () => false, {}, [])).toBeNull();
});
test("Continue shares the recently begun module and actual first incomplete section", () => {
  const target = nextLearningTarget(modules, new Set(), () => true, { b: { completed: 2, total: 4 } }, [], "b", 2);
  expect(target?.module.id).toBe("b");
  expect(target?.started).toBe(true);
  expect(target?.section).toBe(2);
  expect(target?.percent).toBe(50);
});
test("all completed opens the most recently earned lesson for review", () => {
  const target = nextLearningTarget(modules, new Set(["a", "b"]), () => true, {}, [
    { module_id: "a", earned_at: "2026-11-20" }, { module_id: "b", earned_at: "2026-11-19" },
  ]);
  expect(target?.module.id).toBe("a");
  expect(target?.review).toBe(true);
  expect(target?.percent).toBe(100);
});
test("unfinished quiz remains capped at 95 percent", () => {
  expect(nextLearningTarget(modules, new Set(), () => true, { a: { completed: 4, total: 4 } }, [])?.percent).toBe(95);
});
test("winding path uses the requested repeating offsets", () => {
  expect([...pathOffsets]).toEqual([0, 44, 72, 44, 0, -44, -72, -44]);
  expect(windingConnector(3)).toBe("M 160 48 C 160 124, 204 124, 204 200 C 204 276, 232 276, 232 352");
});