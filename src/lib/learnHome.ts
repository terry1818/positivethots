import { moduleCompletionPercent } from "./learnSmallFixes";

export const pathOffsets = [0, 44, 72, 44, 0, -44, -72, -44] as const;
export const pathNodeSpacing = 152;

export function highlightedTodayChip(atRisk: boolean, bonus: boolean, spin: boolean, challenge: boolean) {
  return atRisk ? "streak" : bonus ? "bonus" : spin ? "spin" : challenge ? "challenge" : null;
}

export function nextLearningTarget<T extends { id: string; slug: string; title: string }>(
  modules: T[], earned: Set<string>, unlocked: (module: T) => boolean,
  progress: Record<string, { completed: number; total: number }>,
  badges: { module_id: string; earned_at: string }[],
  recentId?: string, recentSection?: number,
) {
  const allComplete = modules.length > 0 && modules.every(module => earned.has(module.id));
  const latestBadge = [...badges].sort((a, b) => b.earned_at.localeCompare(a.earned_at))[0];
  const recent = modules.find(module => module.id === recentId && !earned.has(module.id) && unlocked(module));
  const module = allComplete
    ? modules.find(module => module.id === latestBadge?.module_id) || modules[0]
    : recent || modules.find(module => !earned.has(module.id) && unlocked(module));
  if (!module) return null;
  const mp = progress[module.id];
  return {
    module, review: allComplete,
    started: !allComplete && (module.id === recentId || (mp?.completed || 0) > 0),
    percent: moduleCompletionPercent(mp?.completed || 0, mp?.total || 0, earned.has(module.id)),
    section: module.id === recentId ? recentSection || 1 : Math.min((mp?.completed || 0) + 1, mp?.total || 4),
    totalSections: mp?.total || 4,
  };
}

/** Smooth cubic segments pass through the fixed, winding node centres. */
export function windingConnector(count: number) {
  if (count < 1) return "";
  let path = `M 160 ${48}`;
  for (let index = 1; index < count; index++) {
    const previousX = 160 + pathOffsets[(index - 1) % pathOffsets.length];
    const x = 160 + pathOffsets[index % pathOffsets.length];
    const y = 48 + index * pathNodeSpacing;
    const midY = y - pathNodeSpacing / 2;
    path += ` C ${previousX} ${midY}, ${x} ${midY}, ${x} ${y}`;
  }
  return path;
}