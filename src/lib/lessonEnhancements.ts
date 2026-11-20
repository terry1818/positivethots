import type { GuideName } from "./guideRotation";
import type { LessonCheck } from "./lessonCards";

/**
 * Per-lesson presentation extras. The lesson text itself is never rewritten here: this only
 * adds pictures that show the idea on the card, a memory aid, and ungraded recall questions.
 *
 * Why these and nothing else (see docs/lesson-design-evidence.md):
 * - one idea per card, at the learner's pace (segmenting)
 * - a picture that shows the idea, never decoration (multimedia + coherence)
 * - the key sentence stands out (signalling)
 * - recall questions with an explanation (retrieval practice)
 * - warm colour and characters with faces (emotional design)
 * - sound only as feedback to an action, never as background
 */
export interface LessonConcept {
  /** Heading of the content block in the lesson text. */
  heading: string;
  /** Letter of the memory aid this idea stands for. */
  letter?: string;
  art: GuideName;
  /** Describes the picture for screen readers: the picture carries meaning. */
  alt: string;
}
export interface LessonEnhancement {
  hero: { art: GuideName; alt: string };
  mnemonic?: { word: string; caption: string };
  concepts: LessonConcept[];
  checks: LessonCheck[];
}

const enhancements: Record<string, LessonEnhancement> = {
  // Foundation > Consent & Sexual Autonomy > Lesson 1: What Is Consent? The FRIES Model
  "20612de7-667f-4c06-aa0c-9955d9964a70": {
    hero: { art: "guide-fries-hero", alt: "A guide holding up a carton of five fries, one for each letter of FRIES" },
    mnemonic: { word: "FRIES", caption: "Five letters to remember what a real yes looks like." },
    concepts: [
      { heading: "Understanding Consent Through the FRIES Model", art: "guide-study-together", alt: "Two guides learning together" },
      { heading: "Freely Given", letter: "F", art: "guide-fries-free", alt: "One person offers an open hand while the other takes her time to decide, an open padlock between them" },
      { heading: "Reversible", letter: "R", art: "guide-fries-reverse", alt: "A guide holding an undo arrow sign and raising a hand to pause" },
      { heading: "Informed", letter: "I", art: "guide-fries-informed", alt: "Two guides reading a checklist together under a lightbulb" },
      { heading: "Enthusiastic", letter: "E", art: "guide-fries-enthusiastic", alt: "A guide jumping for joy beside a speech bubble with a heart" },
      { heading: "Specific", letter: "S", art: "guide-fries-specific", alt: "A guide pointing at a list where only one box is ticked" },
      { heading: "Why This Matters", art: "guide-high-five", alt: "Two guides sharing a high five" },
    ],
    checks: [
      {
        id: "fries-reversible", after: "Informed",
        prompt: "Sam said yes to staying over. Later that night Sam says, “I’ve changed my mind. I’m going to head home.” Which part of FRIES covers this?",
        options: ["Freely given", "Reversible", "Informed"], answer: 1,
        explanation: "Reversible. Anyone can change their mind at any time, for any reason, even if they said yes before.",
      },
      {
        id: "fries-enthusiastic", after: "Specific",
        prompt: "Jo asks, “Want to kiss?” Riley shrugs and says, “I guess so…” Which part of FRIES is missing?",
        options: ["Specific", "Enthusiastic", "Reversible"], answer: 1,
        explanation: "Enthusiastic. Look for a genuine, excited yes. Silence, hesitation, or “I guess so” are not enthusiasm.",
      },
    ],
  },
};

export function enhancementFor(sectionId: string): LessonEnhancement | null {
  return enhancements[sectionId] ?? null;
}

/**
 * Splits off the first sentence so it can be shown larger. Nothing is rewritten: lead + rest
 * is the original text. Returns null when the text does not open with a short, plain sentence.
 */
export function splitLead(body: string): { lead: string; rest: string } | null {
  const text = body.trim();
  if (/^\s*(?:[-*+] |\d+[.)] |>|\[)/.test(text)) return null;
  const match = text.match(/^([^\n]{20,120}?[.!?]["”]?)(?:\s+)(\S[\s\S]*)$/);
  if (!match) return null;
  const lead = match[1];
  // Leave sentences alone when they end inside quotes, brackets or emphasis.
  if ((lead.match(/\*/g) || []).length % 2 || (lead.match(/["“”]/g) || []).length % 2 || /\([^)]*$/.test(lead)) return null;
  return { lead, rest: match[2] };
}
