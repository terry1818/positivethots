import type { LessonCheck } from "./lessonCards";

/**
 * Per-lesson presentation extras, stored one file per module in src/content/lessons/<module-slug>.json
 * and fetched only when that module is opened. The lesson text itself is never rewritten here: this
 * only adds pictures that show the idea on the card, a memory aid, and ungraded recall questions.
 *
 * Why these and nothing else (see docs/lesson-design-evidence.md):
 * - one idea per card, at the learner's pace (segmenting)
 * - a picture that shows the idea, never decoration (multimedia + coherence)
 * - the key sentence stands out (signalling)
 * - recall questions with an explanation (retrieval practice)
 * - warm colour and characters with faces (emotional design)
 * - sound only as feedback to an action, never as background
 */
export interface LessonPicture {
  /** A guide name ("guide-high-five") or a lesson illustration path under src/assets/lessons ("<module>/<file>.webp"). */
  art: string;
  /** Pixel size of a lesson illustration: reserves its space before it loads. */
  size?: [number, number];
  /** Describes the picture for screen readers: the picture carries meaning. */
  alt: string;
}
export interface LessonConcept extends LessonPicture {
  /** Heading of the content block in the lesson text. */
  heading: string;
  /** Letter of the memory aid this idea stands for. */
  letter?: string;
  /** The idea in one short, everyday sentence. Shown first; the lesson text follows unchanged. */
  plain?: string;
}
export interface LessonEnhancement {
  hero: LessonPicture;
  /** The lesson's main point in one plain sentence. Without it the takeaway card falls back to a line picked from the text. */
  takeaway?: string;
  mnemonic?: { word: string; caption: string };
  concepts: LessonConcept[];
  checks: LessonCheck[];
}

const files = import.meta.glob<Record<string, LessonEnhancement>>("/src/content/lessons/*.json", { import: "default" });
const loaded = new Map<string, Promise<Record<string, LessonEnhancement>>>();

/** Extras for one lesson, or null when the lesson has none (it then renders as a plain card lesson). */
export async function loadEnhancement(moduleSlug: string, sectionId: string): Promise<LessonEnhancement | null> {
  const load = files[`/src/content/lessons/${moduleSlug}.json`];
  if (!load) return null;
  if (!loaded.has(moduleSlug)) loaded.set(moduleSlug, load().catch(() => ({})));
  return (await loaded.get(moduleSlug)!)[sectionId] ?? null;
}

const pictures = import.meta.glob<string>("/src/assets/lessons/**/*.webp", { eager: true, query: "?url", import: "default" });
/** Address of a lesson illustration, or undefined when `art` names a guide instead. */
export function lessonPictureUrl(art: string): string | undefined {
  return pictures[`/src/assets/lessons/${art}`];
}

/**
 * Splits off the first sentence so it can be shown larger. Nothing is rewritten: lead + rest
 * is the original text. Returns null when the text does not open with a short, plain sentence.
 */
export function splitLead(body: string): { lead: string; rest: string } | null {
  const text = body.trim();
  if (/^\s*(?:[-*+] |\d+[.)] |>|\[)/.test(text)) return null;
  const match = text.match(/^([^\n]{20,120}?[.!?]["\u201d]?)(?:\s+)(\S[\s\S]*)$/);
  if (!match) return null;
  const lead = match[1];
  // Leave sentences alone when they end inside quotes, brackets or emphasis.
  if ((lead.match(/\*/g) || []).length % 2 || (lead.match(/["\u201c\u201d]/g) || []).length % 2 || /\([^)]*$/.test(lead)) return null;
  return { lead, rest: match[2] };
}
