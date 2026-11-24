import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { landingRotation, spinTravel, wedgeUnderPointer } from "../src/lib/spinWheel";
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
