import { test, expect } from "bun:test";
import { xpAwardFeedback } from "../src/lib/xpAward";

test("zero awards never trigger XP, level-up, or freeze feedback even with stale client stats", () => {
  expect(xpAwardFeedback({ awarded: 0, new_xp: 3620, new_level: 9, new_streak: 7, freeze_used: false, freezes_remaining: 1 }, 8)).toEqual({ newXP: 0, newLevel: 9, leveledUp: false, newStreak: 7, freezeUsed: false });
});

test("the section popup uses the actual 10 XP award rather than the requested legacy 15", () => {
  expect(xpAwardFeedback({ awarded: 10, new_xp: 105, new_level: 2, new_streak: 1, freeze_used: false, freezes_remaining: 1 }, 1)).toEqual({ newXP: 10, newLevel: 2, leveledUp: true, newStreak: 1, freezeUsed: false });
});