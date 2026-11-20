export type PracticeMode = "mistakes" | "rapid" | "flash" | "match";
export const PRACTICE_SESSION_XP = 5;
export const PRACTICE_DAILY_CAP = 30;
export function practiceUnlocked(badges: number) { return badges > 0; }
export function flashRewardEligible(cards: number) { return cards >= 5; }
export function practiceSessionKey(mode: PracticeMode, date = new Date()) {
  return `${mode}:${date.toISOString().slice(0, 10)}:${Date.now() * 1000 + Math.floor(Math.random() * 1000)}`;
}
/** A missed/self-rated item returns once, never an endless practice loop. */
export function practiceQueue(queue: number[], repeated: Set<number>, revisit: boolean) {
  const [current, ...next] = queue;
  const seen = new Set(repeated);
  if (revisit && !seen.has(current)) { seen.add(current); next.push(current); }
  return { queue: next, repeated: seen };
}