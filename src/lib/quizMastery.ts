export interface MasteryState {
  queue: string[];
  mastered: string[];
  firstTries: Record<string, boolean>;
  misses: Record<string, number>;
  combo: number;
}
export interface MasteryResult {
  passed: boolean;
  score?: number;
  first_try_correct?: number;
  total?: number;
  remaining?: string[];
}
export function createMastery(ids: string[]): MasteryState {
  return { queue: [...ids], mastered: [], firstTries: {}, misses: {}, combo: 0 };
}
export function recordMastery(state: MasteryState, correct: boolean, mastery = true): MasteryState {
  const id = state.queue[0];
  if (!id) return state;
  return {
    queue: [...state.queue.slice(1), ...(!correct && mastery ? [id] : [])],
    mastered: correct ? [...new Set([...state.mastered, id])] : state.mastered,
    firstTries: id in state.firstTries ? state.firstTries : { ...state.firstTries, [id]: correct },
    misses: correct ? state.misses : { ...state.misses, [id]: (state.misses[id] || 0) + 1 },
    combo: correct ? state.combo + 1 : 0,
  };
}
export function restoreRemaining(state: MasteryState, ids: string[]): MasteryState {
  const remaining = [...new Set(ids)];
  return { ...state, queue: remaining, mastered: state.mastered };
}
export function firstTryScore(state: MasteryState, total: number) {
  const correct = Object.values(state.firstTries).filter(Boolean).length;
  return { correct, score: total ? Math.round(100 * correct / total) : 0 };
}
export function shuffledOptionIndexes(count: number, previous?: number[], random = Math.random): number[] {
  const indexes = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }
  if (previous && count > 1 && indexes.every((n, i) => n === previous[i])) indexes.push(indexes.shift() ?? 0);
  return indexes;
}
export function choosePraise(lines: readonly string[], previous: string, random = Math.random) {
  const choices = lines.filter(line => line !== previous);
  return choices[Math.floor(random() * choices.length)] || lines[0];
}
