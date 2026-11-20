import { test, expect } from "bun:test";
import { practiceUnlocked, flashRewardEligible, practiceQueue, practiceSessionKey, PRACTICE_DAILY_CAP, PRACTICE_SESSION_XP } from "../src/lib/practiceHub";
test("Practice unlocks with the first badge", () => { expect(practiceUnlocked(0)).toBe(false); expect(practiceUnlocked(1)).toBe(true); });
test("flash sessions require at least five distinct cards for XP", () => { expect(flashRewardEligible(4)).toBe(false); expect(flashRewardEligible(5)).toBe(true); });
test("a missed item returns once only", () => { const one = practiceQueue([0,1], new Set(), true); expect(one.queue).toEqual([1,0]); const two = practiceQueue([0], one.repeated, true); expect(two.queue).toEqual([]); });
test("practice daily cap allows six five-XP sessions", () => { expect(PRACTICE_SESSION_XP).toBe(5); expect(PRACTICE_DAILY_CAP).toBe(30); expect(PRACTICE_DAILY_CAP / PRACTICE_SESSION_XP).toBe(6); });
test("session keys carry the mode and UTC date", () => { expect(practiceSessionKey("rapid",new Date("2026-11-20T00:00:00Z"))).toMatch(/^rapid:2026-11-20:[1-9][0-9]*$/); });
