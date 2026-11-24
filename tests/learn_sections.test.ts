import { test, expect } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { LEARN_SECTIONS, SECTION_IDS, learnSection, sectionsWithModules } from "../src/lib/learnSections";

// Learn sections are defined once, in src/lib/learnSections.ts. Adding a section means adding one entry there
// plus its colours in src/index.css. These tests catch a section that was only half added.

const css = readFileSync("src/index.css", "utf8");

test("every section has a unique id and the Foundation section comes first", () => {
  expect(new Set(SECTION_IDS).size).toBe(SECTION_IDS.length);
  expect(SECTION_IDS[0]).toBe("foundation");
  expect(LEARN_SECTIONS.filter(s => s.gatesDiscover).map(s => s.id)).toEqual(["foundation"]);
});

test("every section has its colours, guide picture and wording", () => {
  for (const s of LEARN_SECTIONS) {
    expect(css).toContain(`.learn-tier-${s.id}`);
    expect(existsSync(`src/assets/guides/${s.guide}.webp`)).toBe(true);
    for (const text of [s.name, s.roadmapName, s.shortName]) expect(text.trim().length).toBeGreaterThan(0);
    expect(s.badgeBg).toMatch(/^bg-/);
  }
});

test("an unknown section falls back to Foundation instead of breaking the page", () => {
  expect(learnSection("not-a-section").id).toBe("foundation");
  expect(learnSection(null as unknown as string).id).toBe("foundation");
});

test("a section with no modules yet stays hidden", () => {
  const shown = sectionsWithModules([{ tier: "foundation" }, { tier: "growth" }]).map(s => s.id);
  expect(shown).toEqual(["foundation", "growth"]);
});

test("Advanced and Personal Growth need a plan; the rest are free", () => {
  expect(LEARN_SECTIONS.filter(s => s.plan).map(s => s.id).sort()).toEqual(["advanced", "growth"]);
});

test("no page keeps its own copy of the section list", () => {
  const files = ["src/pages/Learn.tsx", "src/components/education/TierRoadmap.tsx", "src/hooks/useFeatureUnlocks.ts",
    "src/components/discovery/CompactProgressBar.tsx", "src/components/admin/EducationConsistencyDashboard.tsx"];
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    expect(src).not.toMatch(/\[\s*"foundation",\s*"sexual_health"/);
  }
});

test("each lesson's pictures and checks live in exactly one module file", () => {
  const seen = new Map<string, string>();
  for (const f of readdirSync("src/content/lessons").filter(f => f.endsWith(".json"))) {
    const data = JSON.parse(readFileSync(`src/content/lessons/${f}`, "utf8")) as Record<string, unknown>;
    for (const id of Object.keys(data)) {
      expect(seen.get(id) ?? f).toBe(f);
      seen.set(id, f);
    }
  }
});

test("every lesson picture points at a file that exists", () => {
  for (const f of readdirSync("src/content/lessons").filter(f => f.endsWith(".json"))) {
    const data = JSON.parse(readFileSync(`src/content/lessons/${f}`, "utf8")) as Record<string, { concepts?: { art?: string }[] }>;
    for (const lesson of Object.values(data)) for (const c of lesson.concepts ?? []) {
      if (!c.art || c.art.startsWith("guide-")) continue;
      expect(existsSync(`src/assets/lessons/${c.art}`)).toBe(true);
    }
  }
});

test("lesson text corrections only point at modules that still exist", () => {
  const modules = new Set(readdirSync("src/content/lesson-text/modules").map(f => f.replace(/\.json$/, "")));
  const index = JSON.parse(readFileSync("src/content/lesson-text/index.json", "utf8")) as Record<string, { m: string }>;
  for (const [id, e] of Object.entries(index)) {
    if (!modules.has(e.m)) throw new Error(`${id} points at missing module ${e.m}`);
  }
  for (const gone of ["relationship-orientations", "self-image-inner-blueprint", "divine-matrix-science-of-intention", "embodied-leadership-be-the-change"]) {
    expect(modules.has(gone)).toBe(false);
    expect(existsSync(`src/content/lessons/${gone}.json`)).toBe(false);
  }
});
