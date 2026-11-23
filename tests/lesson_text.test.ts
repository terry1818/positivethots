import { test, expect } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { pickText, pickTitle, textFingerprint, type LessonTextEntry, type LessonTextPatch } from "../src/lib/lessonTextCore";
import { buildLessonCards } from "../src/lib/lessonCards";

// The loader in src/lib/lessonText.ts uses Vite globs, so the files are read directly here.
const root = "src/content/lesson-text";
const index = JSON.parse(readFileSync(`${root}/index.json`, "utf8")) as Record<string, LessonTextEntry>;
const patches = Object.fromEntries(readdirSync(`${root}/modules`).filter(f => f.endsWith(".json"))
  .map(f => [f.replace(/\.json$/, ""), JSON.parse(readFileSync(`${root}/modules/${f}`, "utf8")) as Record<string, LessonTextPatch>]));
const extras = (slug: string) => existsSync(`src/content/lessons/${slug}.json`)
  ? JSON.parse(readFileSync(`src/content/lessons/${slug}.json`, "utf8")) as Record<string, { concepts: { heading: string }[]; checks: { after: string }[] }> : {};

test("the fingerprint matches the one the authoring scripts write", () => {
  expect(textFingerprint("")).toBe("ztntfp.0");
  expect(textFingerprint("abc")).toBe("7aigaz.3");
  expect(textFingerprint("Consent — “yes” means yes 💜")).toBe("18j1w53.28");
  expect(textFingerprint("naïve café\r\nline")).toBe("13cnrsc.16");
});

test("a correction only replaces the exact text and title it was written against", () => {
  const patch = { was: textFingerprint("old text"), text: "new text" };
  expect(pickText(patch, "old text")).toBe("new text");
  expect(pickText(patch, "old text edited by an admin")).toBe("old text edited by an admin");
  expect(pickText(undefined, "old text")).toBe("old text");
  expect(pickTitle({ m: "x", t: "New", wt: "Old" }, "Old")).toBe("New");
  expect(pickTitle({ m: "x", t: "New", wt: "Old" }, "Renamed by an admin")).toBe("Renamed by an admin");
  expect(pickTitle({ m: "x" }, "Old")).toBe("Old");
});

test("every correction file is well formed and listed in the index", () => {
  expect(Object.keys(index).length).toBeGreaterThan(0);
  for (const [slug, lessons] of Object.entries(patches)) for (const [id, patch] of Object.entries(lessons)) {
    const where = `${slug} ${id}`;
    expect(index[id]?.m, where).toBe(slug);
    expect(patch.was, where).toMatch(/^[0-9a-z]+\.\d+$/);
    expect(patch.text.trim().length, where).toBeGreaterThan(200);
    expect(textFingerprint(patch.text), where).not.toBe(patch.was);
    const headings = [...patch.text.matchAll(/^#{2,3} (.+?)\s*$/gm)].map(m => m[1]);
    for (const once of ["Try It Tonight", "If You Need Help Now"]) expect(headings.filter(h => h === once).length, `${where} repeats "${once}"`).toBeLessThanOrEqual(1);
  }
  for (const [id, entry] of Object.entries(index)) {
    const where = `index ${id}`;
    expect(Boolean(entry.t) === Boolean(entry.wt), where).toBe(true);
    if (entry.t) expect(entry.t, where).not.toBe(entry.wt);
    expect(Boolean(patches[entry.m]?.[id]) || Boolean(entry.t), `${where} changes nothing`).toBe(true);
  }
});

test("pictures, plain lines and recall questions still match a card of the corrected lesson", () => {
  for (const [slug, lessons] of Object.entries(patches)) {
    const rich = extras(slug);
    for (const [id, patch] of Object.entries(lessons)) {
      const titles = new Set(buildLessonCards({ id, title: "t", section_number: 1, estimated_minutes: 5, reflection_prompt: null, content_text: patch.text })
        .flatMap(card => card.type === "content" ? [card.title] : []));
      for (const concept of rich[id]?.concepts ?? []) expect(titles.has(concept.heading), `${slug} ${id}: no card titled "${concept.heading}"`).toBe(true);
      for (const check of rich[id]?.checks ?? []) expect(titles.has(check.after), `${slug} ${id}: question follows missing card "${check.after}"`).toBe(true);
    }
  }
});

test("no lesson says a relationship style or a disproven figure is the default", () => {
  const all = Object.values(patches).flatMap(lessons => Object.values(lessons).map(p => p.text)).join("\n");
  for (const gone of ["98% of abusive relationships", "94% relationship survival", "Positive Sexuality and Behavior", "2008 Nobel Prize", "40% fewer conflicts", "35% higher relationship satisfaction", "by 13.5%", "you're 37x better than you started"]) expect(all.includes(gone), gone).toBe(false);
});

test("every help card carries the crisis numbers", () => {
  const cards = Object.values(patches).flatMap(lessons => Object.values(lessons)).filter(p => p.text.includes("## If You Need Help Now"));
  expect(cards.length).toBeGreaterThanOrEqual(12);
  for (const card of cards) expect(/988|1-800-799-7233|StopNCII/.test(card.text.split("## If You Need Help Now")[1])).toBe(true);
});
