export interface FinishData {
  kind: "lesson" | "badge" | "review";
  moduleId: string; title: string; slug: string; tier: string;
  node: string; xp: number | null; oldXP: number; newXP?: number;
  checkpoints?: number; checkpointTotal?: number; seconds?: number;
  lessonsDone?: number; lessonTotal?: number;
  firstLessonToday?: boolean; oldStreak?: number; streak?: number;
  level?: number; accuracy?: number; questions?: number;
  tierComplete?: boolean; tierLabel?: string; features?: string[];
  saving?: boolean;
}
export type FinishStep = "lesson" | "streak" | "level" | "badge" | "results" | "tier" | "review";
export function finishSteps(data: FinishData): FinishStep[] {
  if (data.kind === "review") return ["review"];
  const steps: FinishStep[] = data.kind === "lesson" ? ["lesson"] : ["badge", "results"];
  if (data.kind === "lesson" && data.firstLessonToday) steps.push("streak");
  if (data.level) steps.push("level");
  if (data.kind === "badge" && data.tierComplete) steps.push("tier");
  return steps;
}
export function completedNodeId(data: { moduleId: string; node: string }, sections: { id: string; module_id: string; section_number: number }[]) {
  return data.node === "badge" ? `quiz:${data.moduleId}` : sections.find(s => s.module_id === data.moduleId && s.section_number === Number(data.node.replace("lesson-", "")))?.id;
}