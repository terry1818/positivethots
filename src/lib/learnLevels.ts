export interface LessonSection { id: string; module_id: string; section_number: number; title: string }
export function lessonEntry(sections: LessonSection[], completed: Set<string>, section: string | null, quiz: string | null) {
  const next = Math.max(0, sections.findIndex(s => !completed.has(s.id)));
  const allDone = sections.length > 0 && sections.every(s => completed.has(s.id));
  if (quiz === "1") return { index: next, quiz: allDone, blockedQuiz: !allDone };
  const requested = sections.findIndex(s => String(s.section_number) === section);
  const unlocked = requested >= 0 && sections.slice(0, requested).every(s => completed.has(s.id));
  return { index: unlocked ? requested : next, quiz: false, blockedQuiz: false };
}
export function reviewSourceId(tier: string, date = new Date()) { return `${tier}:${date.toISOString().slice(0, 10)}`; }
export function levelNodes(sections: LessonSection[], completed: Set<string>, earned: boolean, unlocked: boolean) {
  const first = sections.findIndex(s => !completed.has(s.id));
  return [...sections.map((s, index) => ({ id: s.id, title: s.title, section: s.section_number,
    done: completed.has(s.id), unlocked: unlocked && sections.slice(0, index).every(s => completed.has(s.id)), current: !earned && index === first })),
    { id: "quiz", title: "Badge Check", section: 0, done: earned,
      unlocked: unlocked && sections.length > 0 && first === -1, current: !earned && sections.length > 0 && first === -1 }];
}