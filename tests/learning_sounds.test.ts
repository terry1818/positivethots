import { expect, test } from "bun:test";
import { comboExtraNotes, learningSoundNotes, playLearningSound } from "../src/lib/soundGenerator";

test("combo milestones add one, two and three notes at 3, 5 and 10 only", () => {
  expect(comboExtraNotes(3)).toBe(1);
  expect(comboExtraNotes(5)).toBe(2);
  expect(comboExtraNotes(10)).toBe(3);
  for (const count of [0, 1, 2, 4, 6, 9, 11]) expect(comboExtraNotes(count)).toBe(0);
});
test("learning sounds never create audio before a user gesture", () => {
  let created = 0;
  globalThis.AudioContext = class { constructor() { created++; } } as unknown as typeof AudioContext;
  playLearningSound("nodeTap");
  playLearningSound("correct");
  expect(created).toBe(0);
});
test("chest shimmer has five notes and level fanfare four", () => {
  expect(learningSoundNotes.chestOpen.length).toBe(5);
  expect(learningSoundNotes.levelComplete.length).toBe(4);
});
