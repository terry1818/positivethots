import { GuideArt } from "@/components/mascot/GuideArt";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { CheckCircle2, ChevronLeft, Loader2, MoreHorizontal, Volume2, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { BrandedEmptyState } from "@/components/BrandedEmptyState";
import { Mascot } from "@/components/mascot/LearnMascot";
import { PressScale } from "@/components/motion/PressScale";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useReadAloud } from "@/hooks/useReadAloud";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useQuizAnswer, type AnswerFeedback } from "@/hooks/useQuizAnswer";
import { buildLessonCards, resumeCardIndex, type LessonCheckpoint, type LessonSection } from "@/lib/lessonCards";
import { distance, duration, easing } from "@/lib/motionTokens";
import { cn } from "@/lib/utils";
import { KeyTakeaway } from "./KeyTakeaway";
import { ReflectionPrompt } from "./ReflectionPrompt";
import { ReadAloudControls, renderMarkdown } from "./SectionContent";

export function LessonViewMenu({ article, onSwitch }: { article: boolean; onSwitch: () => void }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="Lesson options"><MoreHorizontal /></Button></DropdownMenuTrigger>
    <DropdownMenuContent><DropdownMenuItem className="min-h-11" onSelect={onSwitch}>Switch to {article ? "card" : "article"} view</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}
export function LessonPlayerSkeleton() {
  return <div className="fixed inset-0 z-40 bg-background flex flex-col" aria-label="Loading lesson" aria-busy="true">
    <div className="h-[56px] shrink-0 border-b border-border p-4"><div className="h-6 rounded bg-muted animate-pulse" /></div>
    <div className="flex-1 min-h-0 p-[20px]"><div className="h-full bg-muted rounded animate-pulse" /></div>
    <div className="p-4 pb-[max(16px,env(safe-area-inset-bottom))]"><div className="h-[52px] rounded bg-muted animate-pulse" /></div>
  </div>;
}
function Checkpoint({ question, saved, onAnswered }: { question: LessonCheckpoint; saved?: { selected: number; feedback: AnswerFeedback }; onAnswered: (selected: number, feedback: AnswerFeedback) => void }) {
  const [selected, setSelected] = useState<number | null>(saved?.selected ?? null);
  const start = useRef(Date.now());
  const { check, pending, feedback, error, retry } = useQuizAnswer();
  const result = saved?.feedback ?? feedback;
  const { playCorrect, playMiss } = useSoundEffects();
  useEffect(() => { if (feedback && !saved) { if (feedback.is_correct) playCorrect(); else playMiss(); } }, [feedback, playCorrect, playMiss]);
  useEffect(() => { if (feedback && selected !== null) onAnswered(selected, feedback); }, [feedback, selected, onAnswered]);
  return <div className="space-y-4">{!result && <GuideArt name="guide-thinking" size={72}/>}<p>{question.question}</p><div className="space-y-2">{question.options.map((option, i) => <Button key={i} variant="outline"
    className={cn("w-full min-h-11 h-auto whitespace-normal justify-start text-left py-3", result && i === result.correct_answer && "quiz-option-success disabled:opacity-100", result && selected === i && !result.is_correct && "border-destructive text-destructive disabled:opacity-100")}
    disabled={pending || !!result || error} onClick={() => { setSelected(i); void check(question.id, i, Date.now() - start.current); }}>
    {pending && selected === i && <Loader2 className="h-4 w-4 mr-2 shrink-0 animate-spin" />}<span>{option}</span>{result && i === result.correct_answer && <CheckCircle2 className="ml-2 h-4 w-4 shrink-0" aria-label="Correct answer" />}{result && selected === i && !result.is_correct && <XCircle className="ml-2 h-4 w-4 shrink-0" aria-label="Your answer was not correct" />}
  </Button>)}</div><div aria-live="polite">{result && <div className="space-y-2"><p className="flex items-center gap-2 font-semibold">{result.is_correct ? <><CheckCircle2 className="quiz-feedback-success" />Correct!</> : <><XCircle className="text-destructive" />Not quite</>}</p><p>{result.explanation}</p></div>}</div>
    {error && <div role="alert"><p>We couldn't check that answer. Try again.</p><Button variant="outline" className="min-h-11" onClick={retry} disabled={pending}>Retry</Button></div>}
  </div>;
}
interface Props {
  section: LessonSection; checkpoints: LessonCheckpoint[]; initialIndex: number; isCompleted: boolean; userId: string;
  onSavePosition: (index: number) => void; onExit: () => void; onArticle: () => void;
  onComplete: () => Promise<number | null>; onNext: () => void; onReflectionSaved: () => Promise<void>;
}
export function LessonPlayer({ section, checkpoints, initialIndex, isCompleted, userId, onSavePosition, onExit, onArticle, onComplete, onNext, onReflectionSaved }: Props) {
  const { playCardAdvance } = useSoundEffects();
  const cards = useMemo(() => buildLessonCards(section, checkpoints), [section, checkpoints]);
  const [index, setIndex] = useState(() => resumeCardIndex(initialIndex, cards.length));
  const [direction, setDirection] = useState(1);
  const [finishing, setFinishing] = useState(false);
  const [completionError, setCompletionError] = useState(false);
  const [listenOpen, setListenOpen] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [results, setResults] = useState<Record<string, { selected: number; feedback: AnswerFeedback }>>({});
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const busy = useRef(false);
  const finished = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const indexRef = useRef(index); indexRef.current = index;
  const saveRef = useRef(onSavePosition); saveRef.current = onSavePosition;
  const reduced = useReducedMotion();
  const card = cards[index];
  const blocked = card.type === "checkpoint" && !results[card.checkpoint.id];
  const finish = useCallback(async () => {
    if (busy.current || finished.current) return;
    busy.current = true; setFinishing(true); setCompletionError(false);
    try {
      const award = await onComplete(); if (award === null) { setCompletionError(true); return; }
      finished.current = true; onNext();
    } finally { busy.current = false; setFinishing(false); }
  }, [isCompleted, onComplete, onNext]);
  const move = useCallback((delta: number) => {
    if (busy.current || (delta > 0 && blocked)) return;
    if (index + delta >= cards.length) { void finish(); return; }
    if (index + delta < 0) return;
    playCardAdvance(); setDirection(delta); setIndex(index + delta);
  }, [index, blocked, cards.length, finish]);
  const readEndRef = useRef<() => void>(() => {});
  const audio = useReadAloud(() => readEndRef.current());
  const shouldRead = useRef(false);
  readEndRef.current = () => {
    if (!autoAdvance || card.type === "checkpoint" || card.type === "reflection" || index === cards.length - 1) return;
    shouldRead.current = true; move(1);
  };
  const readable = card.type === "checkpoint" ? `${card.title}. ${card.checkpoint.question}. ${card.checkpoint.options.join(". ")}`
    : `${card.title}. ${"body" in card ? card.body : `Lesson ${card.lesson} of 4. ${card.minutes ?? ""} minutes.`}`;
  useEffect(() => {
    audio.stop();
    if (shouldRead.current) { shouldRead.current = false; if (card.type !== "checkpoint" && card.type !== "reflection") void audio.play(readable); }
    const timer = setTimeout(() => heading.current?.focus(), reduced ? 110 : 420);
    return () => clearTimeout(timer);
  }, [index]);
  useEffect(() => {
    const timer = setTimeout(() => saveRef.current(index), 1000);
    return () => clearTimeout(timer);
  }, [index]);
  useEffect(() => {
    const save = () => saveRef.current(indexRef.current);
    window.addEventListener("pagehide", save);
    return () => { window.removeEventListener("pagehide", save); save(); audio.stop(); };
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("input,textarea,select,[role=menu],[role=dialog],[contenteditable=true]")) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft" || (event.key === "Enter" && !target.closest("button,a,[role=checkbox]"))) {
        event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1);
      }
    };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  }, [move]);
  const answered = useCallback((selected: number, feedback: AnswerFeedback) => {
    if (card.type === "checkpoint") setResults(prev => prev[card.checkpoint.id] ? prev : { ...prev, [card.checkpoint.id]: { selected, feedback } });
  }, [card]);
  const exit = () => { onSavePosition(index); audio.stop(); onExit(); };
  if (!section.content_text?.trim()) return <div className="fixed inset-0 z-40 bg-background overflow-auto"><BrandedEmptyState illustration={<GuideArt name="guide-waving" size={160}/>} mascot="graduate" headline="This lesson is being written. Check back soon." description="" ctaLabel="Back to my path" onCtaClick={exit} /></div>;
  return <div className="fixed inset-0 z-40 bg-background text-foreground flex flex-col pt-[env(safe-area-inset-top)]">
    <header className="h-[56px] shrink-0 flex items-center gap-1 border-b border-border px-2">
      <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="Exit lesson" onClick={exit}><X /></Button>
      <div role="progressbar" aria-label="Lesson cards" aria-valuenow={index + 1} aria-valuemin={0} aria-valuemax={cards.length} className="flex flex-1 min-w-0 gap-1">
        {cards.map((_, i) => <div key={i} className="h-2 flex-1 min-w-0 overflow-hidden rounded-sm bg-muted"><m.div className="h-full bg-learn-info origin-left" initial={false} animate={{ scaleX: i <= index ? 1 : 0 }} transition={{ duration: reduced ? 0.1 : duration.normal }} /></div>)}
      </div>
      <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="Read aloud" aria-pressed={listenOpen} onClick={() => setListenOpen(v => !v)}><Volume2 /></Button>
      <LessonViewMenu article={false} onSwitch={() => { onSavePosition(index); onArticle(); }} />
    </header>
    {listenOpen && <div className="px-5 border-b border-border shrink-0 max-h-[35dvh] overflow-auto"><ReadAloudControls contentText={readable} controls={audio} /><label className="min-h-11 flex items-center gap-2"><Checkbox checked={autoAdvance} onCheckedChange={v => setAutoAdvance(v === true)} />Auto-advance</label></div>}
    <p className="sr-only" aria-live="polite" aria-atomic="true">Card {index + 1} of {cards.length}</p>
    <div className="flex-1 min-h-0 overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <m.section key={index} role="region" aria-labelledby={`lesson-card-${index}`} className="h-full overflow-y-auto overscroll-contain p-[20px] touch-pan-y"
          custom={direction} variants={{ enter: (d: number) => ({ opacity: 0, x: reduced ? 0 : d * distance.lg }), visible: { opacity: 1, x: 0 }, leave: (d: number) => ({ opacity: 0, x: reduced ? 0 : -d * distance.lg, transition: { duration: reduced ? 0.1 : 0.15 } }) }}
          initial="enter" animate="visible" exit="leave" transition={{ duration: reduced ? 0.1 : 0.25, ease: easing.smooth }}
          onPointerDown={event => { if (!(event.target as HTMLElement).closest("button,a,input,textarea,iframe")) { pointer.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); } }}
          onPointerCancel={() => { pointer.current = null; }}
          onPointerUp={event => { const start = pointer.current; pointer.current = null; if (start && Math.abs(event.clientX - start.x) > 65 && Math.abs(event.clientY - start.y) < 50) move(event.clientX < start.x ? 1 : -1); }}>
          <div className="max-w-[65ch] mx-auto text-base leading-relaxed break-words">
            <h2 ref={heading} tabIndex={-1} id={`lesson-card-${index}`} className={cn("font-bold mb-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring", card.type === "title" ? "text-2xl" : "continued" in card && card.continued ? "text-lg" : "text-xl")}>{card.title || section.title}{"continued" in card && card.continued && <span className="font-normal text-muted-foreground"> — continued</span>}</h2>
            {card.type === "title" && <div className="text-center space-y-6"><GuideArt name={card.lesson === 1 ? "guide-waving" : "guide-lesson-reading"} size={160} /><p>Lesson {card.lesson} of 4{card.minutes ? ` · ${card.minutes} min` : ""}</p></div>}
            {(card.type === "content" || card.type === "video") && <div>{renderMarkdown(card.body)}</div>}
            {card.type === "checkpoint" && <Checkpoint question={card.checkpoint} saved={results[card.checkpoint.id]} onAnswered={answered} />}
            {card.type === "takeaway" && <KeyTakeaway takeaway={card.body} sectionTitle={section.title} sectionId={section.id} />}
            {card.type === "reflection" && <ReflectionPrompt sectionId={section.id} userId={userId} prompt={card.body} onSkip={() => void finish()} onSaveAndContinue={async () => { await onReflectionSaved(); void finish(); }} />}
          </div>
        </m.section>
      </AnimatePresence>
    </div>
    <footer className="shrink-0 border-t border-border p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
      {completionError && <p role="alert" className="mb-2 text-destructive">We couldn't save your lesson. Try again.</p>}
      <div className="flex gap-2 max-w-[65ch] mx-auto">
        {index > 0 && <Button variant="ghost" size="icon" className="min-h-[52px] min-w-11" aria-label="Previous card" disabled={finishing} onClick={() => move(-1)}><ChevronLeft /></Button>}
        <PressScale className="flex-1"><Button className="w-full min-h-[52px]" disabled={blocked || finishing} onClick={() => move(1)}>{finishing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{index === cards.length - 1 ? "Finish lesson" : card.type === "title" ? "Let's go" : "Continue"}</Button></PressScale>
      </div>
      {card.type === "reflection" && <Button variant="ghost" className="min-h-11 block mx-auto" disabled={finishing} onClick={() => void finish()}>Skip for now</Button>}
    </footer>
  </div>;
}
