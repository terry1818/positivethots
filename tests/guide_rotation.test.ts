import { test, expect } from "bun:test";
import { guideManifest, localGuideDate, selectGuide } from "../src/lib/guideRotation";

test("23 alternates and 6 lesson pictures join 24 originals with explicit dimensions", () => {
  expect(Object.keys(guideManifest)).toHaveLength(53);
  expect(guideManifest["guide-waving-b.webp"]).toEqual([284, 640]);
});
test("a user's daily image never changes between renders", () => {
  const expected = selectGuide("guide-thinking", "member-13", "2026-11-20");
  for (let i = 0; i < 10; i++) expect(selectGuide("guide-thinking", "member-13", "2026-11-20")).toBe(expected);
});
test("signed-out daily choices are stable and rotate across days", () => {
  const choices = new Set(Array.from({ length: 30 }, (_, i) => selectGuide("guide-thinking", "", `2026-11-${i + 1}`)));
  expect(choices.size).toBe(3);
  expect(selectGuide("guide-waving", "", "2026-11-20")).toBe(selectGuide("guide-waving", "", "2026-11-20"));
});
test("selection stays within the requested meaning and uses local dates", () => {
  expect(selectGuide("guide-high-five", "member-13", "2026-11-20")).toBe("guide-high-five.webp");
  expect(localGuideDate(new Date(2026, 10, 20, 23, 59))).toBe("2026-11-20");
});
