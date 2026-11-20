import { extractTakeaway } from "./learnSmallFixes";

export interface LessonSection {
  id: string;
  title: string;
  section_number: number;
  estimated_minutes: number | null;
  content_text?: string | null;
  reflection_prompt?: string | null;
}
export interface LessonCheckpoint {
  id: string;
  question: string;
  options: string[];
  position_in_section: number;
}
export type LessonCard =
  | { type: "title"; title: string; lesson: number; minutes: number | null }
  | { type: "content" | "video"; title: string; body: string; continued: boolean }
  | { type: "checkpoint"; title: string; checkpoint: LessonCheckpoint }
  | { type: "takeaway"; title: string; body: string }
  | { type: "reflection"; title: string; body: string };

/** Blank-line-separated lists stay together, even when authors leave blanks between items. */
function paragraphs(body: string): string[] {
  const parts = body.trim().split(/\n\s*\n/).filter(p => p.trim());
  const result: string[] = [];
  const isList = (p: string) => /^\s*(?:[-*+] |\d+[.)] )/.test(p);
  for (const part of parts) {
    const previous = result[result.length - 1];
    if (previous && isList(previous) && isList(part)) result[result.length - 1] += `\n\n${part}`;
    else result.push(part);
  }
  return result;
}
const isVideo = (text: string) => /\[youtube:[^\]]*\]\(https?:\/\/[^)]+\)/i.test(text)
  || /^https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/\S+\s*$/.test(text.trim());

/** Splitting is presentation-only: no paragraph or list is truncated or rewritten. */
export function buildLessonCards(section: LessonSection, checkpoints: LessonCheckpoint[] = []): LessonCard[] {
  const text = (section.content_text || "").replace(/\r\n/g, "\n");
  const hasHeadings = /^#{2,3} /m.test(text);
  const blocks: { title: string; body: string }[] = [];
  let title = "";
  let lines: string[] = [];
  const flush = () => { if (title || lines.join("\n").trim()) blocks.push({ title, body: lines.join("\n") }); };
  for (const line of text.split("\n")) {
    const heading = line.match(/^#{2,3} (.*)$/);
    if (heading) { flush(); title = heading[1]; lines = []; }
    else lines.push(line);
  }
  flush();
  const content: LessonCard[] = [];
  for (const block of blocks) {
    let chunk = "";
    let emitted = false;
    const emit = () => {
      if (!chunk && (!block.title || emitted)) return;
      content.push({ type: "content", title: block.title, body: chunk, continued: emitted });
      emitted = true; chunk = "";
    };
    for (const paragraph of paragraphs(block.body)) {
      if (isVideo(paragraph)) {
        emit();
        content.push({ type: "video", title: block.title, body: paragraph, continued: emitted });
        emitted = true;
      } else {
        const limit = hasHeadings ? 700 : 600;
        if (chunk && chunk.length + paragraph.length + 2 > limit) emit();
        chunk += `${chunk ? "\n\n" : ""}${paragraph}`;
      }
    }
    emit();
  }
  const cards: LessonCard[] = [{ type: "title", title: section.title, lesson: section.section_number, minutes: section.estimated_minutes }];
  // Real sections have ample cards; with tiny sections only place checkpoints in distinct interior gaps.
  const ordered = [...checkpoints].sort((a, b) => a.position_in_section - b.position_in_section);
  const count = Math.min(ordered.length, Math.max(0, content.length - 1));
  const slots = new Map<number, LessonCheckpoint>();
  let previous = 0;
  for (let i = 0; i < count; i++) {
    const slot = Math.max(previous + 1, Math.min(content.length - (count - i), Math.round(content.length * (i + 1) / 3)));
    slots.set(slot, ordered[i]); previous = slot;
  }
  content.forEach((card, i) => {
    cards.push(card);
    const checkpoint = slots.get(i + 1);
    if (checkpoint) cards.push({ type: "checkpoint", title: "Quick Check", checkpoint });
  });
  cards.push({ type: "takeaway", title: "Key Takeaway", body: extractTakeaway(text) });
  if (section.reflection_prompt) cards.push({ type: "reflection", title: "Your Reflection", body: section.reflection_prompt });
  return cards;
}

export function resumeCardIndex(index: number, total: number): number {
  return Number.isInteger(index) && index >= 0 && index < total ? index : 0;
}
