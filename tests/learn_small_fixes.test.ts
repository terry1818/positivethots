import { test, expect } from "bun:test";
import { extractTakeaway, moduleCompletionPercent, rollDailyReward } from "../src/lib/learnSmallFixes";
import { calculateLevel, getXPForCurrentLevel, getXPForNextLevel } from "../src/hooks/useLearningStats";
import { useSessionStore } from "../src/stores/sessionStore";

test("daily reward is stable for a user and day with unchanged reward amounts", () => {
  const reward = rollDailyReward("member", "2026-11-20");
  expect(rollDailyReward("member", "2026-11-20")).toEqual(reward);
  expect([0, 5, 10, 15, 25]).toContain(reward.xp);
  expect(new Set(Array.from({ length: 30 }, (_, i) => rollDailyReward("member", `day-${i}`).xp)).size).toBeGreaterThan(1);
});

test("daily reward dismissal lasts for the session", () => {
  expect(useSessionStore.getState().isBannerDismissed("daily_reward")).toBe(false);
  useSessionStore.getState().dismissBanner("daily_reward");
  expect(useSessionStore.getState().isBannerDismissed("daily_reward")).toBe(true);
});

test("takeaways prefer bold text and otherwise preserve full sentences within 180 characters", () => {
  expect(extractTakeaway("**This is the key point to remember.**\n\nAnother sufficiently long paragraph.")).toBe("This is the key point to remember.");
  const first = "Consent is an ongoing conversation.";
  expect(extractTakeaway(`${first} ${"More detail ".repeat(30)}.`)).toBe(first);
  const long = `- ${"Understanding ".repeat(30)}.`;
  const result = extractTakeaway(long);
  expect(result.endsWith("Understanding...")).toBe(true);
  expect(result.length).toBeLessThanOrEqual(183);
  expect(result).not.toContain("- ");
});

test("3620 XP is level 9, part-way from 3600 to 4500; top level is 10", () => {
  expect(calculateLevel(3620)).toBe(9);
  expect(getXPForCurrentLevel(9)).toBe(3600);
  expect(getXPForNextLevel(9)).toBe(4500);
  for (const [xp, level] of [[0,1],[100,2],[300,3],[600,4],[1000,5],[1500,6],[2100,7],[2800,8],[3600,9],[4500,10],[5000,10]]) {
    expect(calculateLevel(xp)).toBe(level);
  }
});

test("a badge makes module progress 100%; completed content alone remains 95%", () => {
  expect(moduleCompletionPercent(6, 6, false)).toBe(95);
  expect(moduleCompletionPercent(6, 6, true)).toBe(100);
  expect(moduleCompletionPercent(0, 6, true)).toBe(100);
  expect(moduleCompletionPercent(3, 6, false)).toBe(50);
});