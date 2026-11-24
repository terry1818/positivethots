import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import { landingRotation, pickLegacyXpReward, SPIN_REWARDS, SPIN_WEIGHTS, spinTravel, wedgeUnderPointer } from "../src/lib/spinWheel";
import { getNextStreakReward } from "../src/hooks/useLearningStats";
import { tickShape } from "../src/lib/spinSounds";
import { computeProfileCompletion } from "../src/hooks/useProfileCompletion";
import { spinWinNotes } from "../src/lib/soundGenerator";

const css = readFileSync("src/index.css", "utf8");
const light = css.slice(css.indexOf("App kit"));
const value = (block: string, name: string) => {
  const m = block.match(new RegExp(`--${name}:\\s*([\\d.]+)\\s+([\\d.]+)%\\s+([\\d.]+)%`));
  if (!m) throw new Error(`--${name} is not defined`);
  return [Number(m[1]), Number(m[2]), Number(m[3])] as const;
};
const rgb = ([h, s, l]: readonly [number, number, number]) => {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => { const k = (n + h / 30) % 12; return l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return [f(0), f(8), f(4)] as const;
};
const luminance = (c: readonly number[]) => {
  const [r, g, b] = c.map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: readonly number[], b: readonly number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const white = [1, 1, 1] as const;

test("white text is readable on every area colour", () => {
  for (const area of ["discover", "likes", "chat", "profile"]) {
    expect(contrast(white, rgb(value(light, `kit-${area}-top`)))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(white, rgb(value(light, `kit-${area}-bottom`)))).toBeGreaterThanOrEqual(4.5);
  }
});

test("each area's text tint is readable on cards in both themes", () => {
  const rootBlock = light.slice(light.indexOf(":root {"), light.indexOf(".dark {"));
  const darkBlock = light.slice(light.indexOf(".dark {"), light.indexOf(".kit-area-discover"));
  const lightCard = rgb([0, 0, 100]), darkCard = rgb([270, 20, 15]);
  for (const area of ["discover", "likes", "learn", "chat", "profile"]) {
    expect(contrast(rgb(value(rootBlock, `kit-${area}-text`)), lightCard)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(rgb(value(darkBlock, `kit-${area}-text`)), darkCard)).toBeGreaterThanOrEqual(4.5);
  }
});

test("every kit colour has a fallback, so a kit piece works outside an area class", () => {
  const rules = light.split("\n").filter(line => /^\.kit-(?!area-)/.test(line));
  expect(rules.length).toBeGreaterThan(20);
  for (const rule of rules) expect(rule).not.toMatch(/var\(--path-(top|bottom|lip)\)/);
});

test("kit motion is switched off for people who ask for reduced motion", () => {
  const reduced = light.slice(light.lastIndexOf("@media (prefers-reduced-motion: reduce)", light.indexOf("Daily spin wheel")));
  for (const piece of [".kit-rise", ".kit-pop", ".kit-cta", ".kit-nav-pill"]) expect(reduced).toContain(piece);
  expect(css.slice(css.indexOf("Daily spin wheel"))).toContain("prefers-reduced-motion");
});

test("the wheel stops on the prize it awards", () => {
  const count = 8, seg = 360 / count;
  for (let index = 0; index < count; index++) {
    for (const within of [0, -(seg / 2 - 8), seg / 2 - 8]) {
      for (const from of [0, 337.5, 123.4]) {
        const landing = landingRotation(index, count, within);
        const end = from + spinTravel(from, landing);
        expect(wedgeUnderPointer(end, count)).toBe(index);
        expect(end - from).toBeGreaterThanOrEqual(360 * 6);
      }
    }
  }
});

test("rarer prizes get a longer win sound", () => {
  expect(spinWinNotes.common.length).toBeLessThan(spinWinNotes.uncommon.length);
  expect(spinWinNotes.uncommon.length).toBeLessThan(spinWinNotes.rare.length);
  expect(spinWinNotes.rare.length).toBeLessThan(spinWinNotes.very_rare.length);
});

test("profile steps match the checks behind the percentage", () => {
  const empty = computeProfileCompletion({ profile: { name: "A" }, userPhotos: [], badges: [], promptCount: 0 });
  expect(empty.percentage).toBe(10);
  expect(empty.steps.filter(s => s.done)).toHaveLength(0);
  expect(empty.steps).toHaveLength(9);

  const full = computeProfileCompletion({
    profile: { bio: "Hi", gender: "x", pronouns: "they", sexuality: "x", relationship_style: "x", relationship_status: "x", interests: ["a", "b", "c", "d", "e"], is_verified: true },
    userPhotos: [1, 2, 3], badges: [1], promptCount: 3,
  });
  expect(full.percentage).toBe(100);
  expect(full.steps.every(s => s.done)).toBe(true);
  expect(full.nudges).toHaveLength(0);

  const one = computeProfileCompletion({ profile: { name: "A" }, userPhotos: [1], badges: [], promptCount: 0 });
  expect(one.percentage).toBe(30);
  expect(one.steps.filter(s => s.done).map(s => s.key)).toEqual(["photo"]);
});

// The server picks and grants the prize, so the wheel's list must match the server's exactly.
const spinSql = (() => {
  const dir = "supabase/migrations";
  const file = readdirSync(dir).filter(f => readFileSync(`${dir}/${f}`, "utf8").includes("FUNCTION public.claim_daily_spin")).sort().pop();
  if (!file) throw new Error("no migration defines claim_daily_spin");
  return readFileSync(`${dir}/${file}`, "utf8");
})();

test("the wheel shows exactly the prizes the server grants, in the same order", () => {
  const values = spinSql.match(/_value := \(ARRAY\[([\d, ]+)\]\)/)![1].split(",").map(Number);
  expect(values).toEqual(SPIN_REWARDS.map(r => r.value));
  const typeOf = (i: number) => (i === 6 ? "thot" : i === 7 ? "freeze" : "xp");
  expect(spinSql).toContain("CASE _index WHEN 6 THEN 'thot' WHEN 7 THEN 'freeze' ELSE 'xp' END");
  SPIN_REWARDS.forEach((reward, i) => expect(reward.type).toBe(typeOf(i)));
  for (const reward of SPIN_REWARDS.filter(r => r.type === "xp")) {
    expect(reward.label).toBe(`+${reward.value} XP`);
    expect(reward.value).toBeLessThanOrEqual(50); // award_xp grants at most 50 for a spin
  }
});

test("the wheel's tiers and chances match the server's", () => {
  const tiers = [...spinSql.matchAll(/_roll < (\d+) THEN\s+_index := \(ARRAY\[([\d, ]+)\]\)/g)].map(m => ({ upTo: Number(m[1]), wedges: m[2].split(",").map(Number) }));
  expect(tiers.map(t => t.upTo)).toEqual([60, 85, 97]);
  const byRarity = (rarity: string) => SPIN_REWARDS.map((r, i) => (r.rarity === rarity ? i : -1)).filter(i => i >= 0);
  expect(tiers[0].wedges).toEqual(byRarity("common"));
  expect(tiers[1].wedges).toEqual(byRarity("uncommon"));
  expect(tiers[2].wedges).toEqual(byRarity("rare"));
  expect(byRarity("very_rare")).toEqual([7]);
  expect(SPIN_WEIGHTS).toEqual({ common: 60, uncommon: 25, rare: 12, very_rare: 3 });
});

test("the fallback for an older database only ever picks XP", () => {
  for (let i = 0; i < 200; i++) {
    const picked = pickLegacyXpReward(() => i / 200);
    expect(picked.reward.type).toBe("xp");
    expect(SPIN_REWARDS[picked.index]).toBe(picked.reward);
  }
});

test("the streak label points at the next reward a streak really earns", () => {
  expect(getNextStreakReward(3)).toEqual({ day: 7, label: "+1 Thot", daysLeft: 4 });
  expect(getNextStreakReward(7)).toEqual({ day: 30, label: "Profile Boost", daysLeft: 23 });
  expect(getNextStreakReward(99)?.daysLeft).toBe(1);
  expect(getNextStreakReward(100)).toBeNull();
});

test("the wheel's recorded sounds exist and its clicks get lower and fuller as it slows", () => {
  for (const file of ["tick-1.wav", "tick-2.wav", "tick-3.wav", "start.mp3", "win-common.mp3", "win-uncommon.mp3", "win-rare.mp3", "win-very-rare.mp3"]) {
    expect(readFileSync(`src/assets/sounds/spin/${file}`).length).toBeGreaterThan(2000);
  }
  const fast = tickShape(0, 0.5), slow = tickShape(1, 0.5);
  expect(slow.gain).toBeGreaterThan(fast.gain);
  expect(slow.rate).toBeLessThan(fast.rate);
  expect(tickShape(5).gain).toBe(slow.gain);
});
