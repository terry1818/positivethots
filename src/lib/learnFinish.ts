export interface FinishData {
  kind: "lesson" | "badge" | "review" | "story" | "practice" | "listen";
  moduleId: string; title: string; slug: string; tier: string;
  node: string; xp: number | null; oldXP: number; newXP?: number;
  checkpoints?: number; checkpointTotal?: number; seconds?: number;
  lessonsDone?: number; lessonTotal?: number;
  firstLessonToday?: boolean; oldStreak?: number; streak?: number;
  level?: number; accuracy?: number; questions?: number;
  tierComplete?: boolean; tierLabel?: string; features?: string[];
  saving?: boolean;
  replay?: boolean;
  message?: string;
  storySummary?: { score: number; maxScore: number; choicesMade: { sceneId: string; choiceIdx: number; isBest: boolean }[]; scenes: { id: string; choices: { text: string; is_best: boolean; feedback: string }[] }[] };
}
export type FinishStep = "lesson" | "streak" | "level" | "badge" | "results" | "tier" | "review";
export function finishSteps(data: FinishData): FinishStep[] {
  if (["review","story","practice","listen"].includes(data.kind)) return ["review"];
  const steps: FinishStep[] = data.kind === "lesson" ? ["lesson"] : ["badge", "results"];
  if (data.kind === "lesson" && data.firstLessonToday) steps.push("streak");
  if (data.level) steps.push("level");
  if (data.kind === "badge" && data.tierComplete) steps.push("tier");
  return steps;
}
export function completedNodeId(data: { moduleId: string; node: string }, sections: { id: string; module_id: string; section_number: number }[]) {
  if (data.node === "badge") return `quiz:${data.moduleId}`;
  if (!data.node.startsWith("lesson-")) return `${data.moduleId}:${data.node}`;
  return sections.find(s => s.module_id === data.moduleId && s.section_number === Number(data.node.replace("lesson-", "")))?.id;
}