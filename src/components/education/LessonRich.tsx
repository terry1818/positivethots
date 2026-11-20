import { useState } from "react";
import { Check, Clock, Lightbulb, X } from "lucide-react";
import { GuideArt, type GuideName } from "@/components/mascot/GuideArt";
import { guideManifest } from "@/lib/guideRotation";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import type { LessonCheck } from "@/lib/lessonCards";
import { lessonPictureUrl, splitLead, type LessonConcept, type LessonEnhancement, type LessonPicture } from "@/lib/lessonEnhancements";
import { cn } from "@/lib/utils";
import { renderMarkdown } from "./SectionContent";

/** A lesson picture: either one of the shared guides or an illustration made for this idea. */
export function LessonPictureArt({ picture, size }: { picture: LessonPicture; size: number }) {
  const src = lessonPictureUrl(picture.art);
  if (src && picture.size) return <GuideArt name="guide-lesson-reading" source={{ src, width: picture.size[0], height: picture.size[1] }} size={size} alt={picture.alt}/>;
  const name = (guideManifest[`${picture.art}.webp`] ? picture.art : "guide-lesson-reading") as GuideName;
  return <GuideArt name={name} size={size} alt={picture.alt}/>;
}

/** One letter of the lesson's memory aid, tied to the card that teaches it. */
export interface MnemonicStep { letter: string; heading: string; index: number }
type StepState = "todo" | "current" | "earned";

/** The memory aid as a row of letters: it fills as ideas are learned and jumps back to any of them. */
export function LessonMnemonic({ word, steps, currentHeading, reached, onJump }: { word: string; steps: MnemonicStep[]; currentHeading: string; reached: number; onJump: (index: number) => void }) {
  const state = (step: MnemonicStep): StepState => step.heading === currentHeading ? "current" : reached > step.index ? "earned" : "todo";
  return <nav className="lesson-mnemonic" aria-label={`${word}: ${steps.filter(s => state(s) === "earned").length} of ${steps.length} learned`}>
    {steps.map(step => { const s = state(step); return <button key={step.letter} type="button" className="lesson-chip" data-state={s} disabled={s === "todo"} aria-current={s === "current" ? "step" : undefined}
      aria-label={`${step.letter}, ${step.heading}${s === "earned" ? ", learned. Go back to it" : s === "current" ? ", this card" : ", coming up"}`} onClick={() => onJump(step.index)}>
      <span aria-hidden="true">{step.letter}</span>{s === "earned" && <Check className="lesson-chip-tick" aria-hidden="true" strokeWidth={4}/>}
    </button>; })}
  </nav>;
}

/** First card: the picture that anchors the memory aid, how long it takes, and the ideas ahead by name. */
export function RichTitle({ enhancement, lesson, minutes, steps }: { enhancement: LessonEnhancement; lesson: number; minutes: number | null; steps: MnemonicStep[] }) {
  return <div className="lesson-title-card">
    <div className="lesson-art lesson-art-hero"><LessonPictureArt picture={enhancement.hero} size={172}/></div>
    <p className="lesson-pills"><span className="lesson-pill">Lesson {lesson} of 4</span>{minutes ? <span className="lesson-pill"><Clock aria-hidden="true" className="h-4 w-4"/>{minutes} min</span> : null}{steps.length > 0 && <span className="lesson-pill"><Lightbulb aria-hidden="true" className="h-4 w-4"/>{steps.length} ideas</span>}</p>
    {enhancement.mnemonic && steps.length > 0 && <>
      <p className="lesson-caption">{enhancement.mnemonic.caption}</p>
      <ol className="lesson-preview" aria-label={`What ${enhancement.mnemonic.word} stands for`}>
        {steps.map((step, i) => <li key={step.letter} style={{ "--i": i } as React.CSSProperties}><span className="lesson-chip" data-state="earned" aria-hidden="true">{step.letter}</span><span>{step.heading}</span></li>)}
      </ol>
    </>}
  </div>;
}

/** A content card: the picture shows the idea, the first sentence stands out, the text is unchanged. */
export function RichContent({ body, concept, continued, tone = 0 }: { body: string; concept: LessonConcept; continued: boolean; tone?: number }) {
  const lead = continued ? null : splitLead(body);
  return <div className="lesson-concept">
    {!continued && concept.art && <div className="lesson-art" data-tone={tone % 3}>
      {concept.letter && <span className="lesson-letter" aria-hidden="true">{concept.letter}</span>}
      <LessonPictureArt picture={concept} size={188}/>
    </div>}
    <div className="lesson-body">
      {lead ? <><div className="lesson-lead">{renderMarkdown(lead.lead)}</div>{renderMarkdown(lead.rest)}</> : renderMarkdown(body)}
    </div>
  </div>;
}

/** An ungraded recall question: one try, then the answer and why. */
export function LocalCheck({ check, selected, onAnswer }: { check: LessonCheck; selected?: number; onAnswer: (choice: number) => void }) {
  const { playCorrect, playMiss } = useSoundEffects();
  const answered = selected !== undefined;
  const correct = selected === check.answer;
  return <div className="lesson-check">
    <div className="lesson-check-head"><GuideArt name="guide-thinking" size={112}/><p className="lesson-scenario">{check.prompt}</p></div>
    <div className="lesson-options" role="group" aria-label="Answers">
      {check.options.map((option, i) => {
        const result = !answered ? undefined : i === check.answer ? "correct" : i === selected ? "wrong" : "idle";
        return <button key={option} type="button" className="lesson-option" data-result={result} disabled={answered}
          onClick={() => { if (i === check.answer) playCorrect(); else playMiss(); onAnswer(i); }}>
          <span className="lesson-option-key" aria-hidden="true">{String.fromCharCode(65 + i)}</span><span className="flex-1">{option}</span>
          {result === "correct" && <Check aria-label="Correct answer" className="h-5 w-5 shrink-0" strokeWidth={3}/>}
          {result === "wrong" && <X aria-label="Your answer" className="h-5 w-5 shrink-0" strokeWidth={3}/>}
        </button>;
      })}
    </div>
    <div aria-live="polite">{answered && <div className={cn("lesson-feedback", correct ? "lesson-feedback-correct" : "lesson-feedback-miss")}>
      <p className="font-extrabold">{correct ? "Yes, that's it!" : "Not quite. Here's the idea:"}</p><p>{check.explanation}</p>
    </div>}</div>
  </div>;
}

/** Last recall before the takeaway: try to name each letter, then tap to see it. */
export function LessonRecap({ word, steps }: { word: string; steps: MnemonicStep[] }) {
  const [shown, setShown] = useState<string[]>([]);
  const { playCardOpen, playTrailFill } = useSoundEffects();
  const done = shown.length === steps.length;
  return <div className="lesson-recap">
    <p className="lesson-caption">{done ? `That's all of ${word}. Nice work.` : "Say what each letter stands for, then tap it to check."}</p>
    <ul>{steps.map(step => { const open = shown.includes(step.letter); return <li key={step.letter}>
      <button type="button" className="lesson-recap-row" data-open={open} aria-expanded={open} aria-label={open ? `${step.letter}: ${step.heading}` : `${step.letter}: tap to check`}
        onClick={() => { if (open) return; if (shown.length + 1 === steps.length) playTrailFill(); else playCardOpen(); setShown(prev => [...prev, step.letter]); }}>
        <span className="lesson-chip" data-state={open ? "earned" : "current"} aria-hidden="true">{step.letter}</span>
        <span className="lesson-recap-word" aria-hidden="true">{open ? step.heading : "Tap to check"}</span>
      </button>
    </li>; })}</ul>
  </div>;
}
