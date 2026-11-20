import { test, expect } from "bun:test";
import { eligibleEarnedFrames, hasEveryBadge } from "../src/lib/badgeCompletion";

test("20 badges out of 35 is not full completion or an Educator award", () => {
  expect(hasEveryBadge(20, 35)).toBe(false);
  expect(eligibleEarnedFrames(["newbie", "scholar", "educator"], 20, 35)).toEqual(["newbie", "scholar"]);
});

test("all 35 badges qualifies for full completion and Educator", () => {
  expect(hasEveryBadge(35, 35)).toBe(true);
  expect(eligibleEarnedFrames(["newbie", "educator"], 35, 35)).toContain("educator");
});

test("loading, failed and empty totals never qualify for all-badge states", () => {
  expect(hasEveryBadge(35, undefined)).toBe(false);
  expect(hasEveryBadge(35, 0)).toBe(false);
  expect(eligibleEarnedFrames(["newbie", "educator"], 35, undefined)).toEqual(["newbie"]);
});

test("completion tracks curriculum growth instead of a fixed 35", () => {
  expect(hasEveryBadge(35, 36)).toBe(false);
  expect(hasEveryBadge(36, 36)).toBe(true);
});