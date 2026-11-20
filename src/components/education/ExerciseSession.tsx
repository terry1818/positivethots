import { useState, useEffect, useRef } from "react";
import { m } from "motion/react";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { comboExtraNotes } from "@/lib/soundGenerator";
import { useQuizAnswer } from "@/hooks/useQuizAnswer";
import type { QuizAnswer, QuizResult } from "@/lib/quizAnswers";
import { createMastery, firstTryScore, recordMastery, restoreRemaining, shuffledOptionIndexes } from "@/lib/quizMastery";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/motion/BottomSheet";
import { GuideArt } from "@/components/mascot/GuideArt";
import { Mascot } from "@/components/mascot/LearnMascot";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Trophy, Zap, Loader2, X } from "lucide-react";
import { duration } from "@/lib/motionTokens";
import { QuizCombo } from "./QuizCombo";
import { QuizFeedbackSheet } from "./QuizFeedbackSheet";
import { GlossarySheet } from "./GlossarySheet";
import { renderMarkdown } from "./SectionContent";
import { supabase } from "@/integrations/supabase/client";
import { reportError } from "@/lib/errorReporting";
interface ExerciseQuestion { id: string; question: string; options: string[]; exercise_type: string; order_index: number; section_id?: string | null }
interface ExerciseSessionProps {
  moduleId: string; moduleTitle: string; questions: ExerciseQuestion[]; userId: string;
  onComplete: (score: number, correct: number, total: number, passed: boolean, answers: QuizAnswer[], startedAt: string) => void;
  finalResult: QuizResult | null; submitting: boolean; submissionError: boolean; onRetrySubmit: () => void; onBack: () => void;
  preserveQuestionOrder?: boolean; mastery?: boolean; review?: boolean; remaining?: string[] | null;
  onLeaveRequestReady?: (request: (() => void) | null) => void;
}
export const ExerciseSession = ({ moduleTitle, questions, onComplete, onBack, finalResult, submitting, submissionError, onRetrySubmit,
  preserveQuestionOrder = false, mastery = true, review = false, remaining, onLeaveRequestReady }: ExerciseSessionProps) => {
  const reduced = useReducedMotion();
  const [ordered] = useState(() => preserveQuestionOrder ? questions : [...questions].sort(() => Math.random() - 0.5));
  const [state, setState] = useState(() => createMastery(ordered.map(q => q.id)));
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [startedAt] = useState(() => new Date().toISOString());
  const [selected, setSelected] = useState<number | null>(null);
  const [optionOrder, setOptionOrder] = useState(() => shuffledOptionIndexes(ordered[0]?.options.length || 0));
  const orders = useRef<Record<string, number[]>>({});
  const [attempt, setAttempt] = useState(0);
  const start = useRef(Date.now());
  const advancing = useRef(false);
  const [leave, setLeave] = useState(false);
  const keepButton = useRef<HTMLButtonElement>(null);
  const [rereadOpen, setRereadOpen] = useState(false);
  const [lesson, setLesson] = useState<{ title: string; content_text: string | null } | null>(null);
  const [lessonError, setLessonError] = useState(false);
  const { pending, feedback, error, check, retry, reset } = useQuizAnswer();
  const { playCorrect, playMiss, playCombo } = useSoundEffects();
  useEffect(() => {
    if (!feedback) return;
    if (!feedback.is_correct) playMiss();
    else if (comboExtraNotes(state.combo + 1)) playCombo(state.combo + 1);
    else playCorrect();
  }, [feedback, playCorrect, playMiss, playCombo]);
  const current = ordered.find(q => q.id === state.queue[0]);
  const showScore = state.queue.length === 0;
  const requestLeave = useRef<() => void>(() => {});
  requestLeave.current = () => { if (showScore && finalResult) onBack(); else setLeave(true); };
  useEffect(() => { onLeaveRequestReady?.(() => requestLeave.current()); return () => onLeaveRequestReady?.(null); }, [onLeaveRequestReady]);
  const resetQuestion = (id: string | undefined) => {
    const next = ordered.find(q => q.id === id);
    if (next) { const order = shuffledOptionIndexes(next.options.length, orders.current[next.id]); orders.current[next.id] = order; setOptionOrder(order); }
    setSelected(null); reset(); start.current = Date.now(); setAttempt(a => a + 1); advancing.current = false;
  };
  useEffect(() => {
    if (!remaining?.length) return;
    const valid = remaining.filter(id => ordered.some(q => q.id === id));
    if (!valid.length) return;
    setState(s => restoreRemaining(s, valid)); resetQuestion(valid[0]);
  }, [remaining]);
  useEffect(() => { if (current && !orders.current[current.id]) orders.current[current.id] = optionOrder; }, [current]);
  const handleContinue = () => {
    if (!current || !feedback || selected === null || advancing.current) return;
    advancing.current = true;
    const next = recordMastery(state, feedback.is_correct, mastery);
    const nextAnswers = [...answers, { question_id: current.id, selected_answer: selected }];
    setState(next); setAnswers(nextAnswers); resetQuestion(next.queue[0]);
    if (!next.queue.length) { const summary = firstTryScore(next, ordered.length); onComplete(summary.score, summary.correct, ordered.length, true, nextAnswers, startedAt); }
  };
  const loadLesson = async () => {
    if (!current?.section_id) return;
    setRereadOpen(true); setLesson(null); setLessonError(false);
    try { const { data, error } = await supabase.from("module_sections").select("title,content_text").eq("id", current.section_id).single(); if (error) throw error; setLesson(data); }
    catch (e) { setLessonError(true); void reportError(e instanceof Error ? e : new Error("Could not load lesson")); }
  };
  if (showScore) return <div className="space-y-6 py-4" aria-live="polite">
    <div className="relative space-y-1"><QuizCombo combo={state.combo} /><p className="text-xs text-muted-foreground">{moduleTitle} · {state.mastered.length}/{ordered.length}</p><div role="progressbar" aria-label="Questions mastered" aria-valuenow={state.mastered.length} aria-valuemax={ordered.length} className="flex gap-0.5 h-1.5">{ordered.map((_, i) => <div key={i} className={cn("flex-1 rounded-full", i < state.mastered.length ? state.combo >= 5 ? "quiz-progress-gold" : "bg-learn-info" : "bg-muted")} />)}</div></div>
    {!finalResult ? submissionError ? <><p>We couldn't save your badge. Try again.</p><Button className="min-h-11" onClick={onRetrySubmit} disabled={submitting}>Try again</Button></> : <Loader2 className="h-5 w-5 animate-spin" aria-label="Saving your badge" />
      : <><div className="text-center space-y-4"><Mascot mood="graduate" size="lg" /><Trophy className="h-10 w-10 text-primary mx-auto" /><h2 className="text-2xl font-bold">{review ? "Review complete" : "Badge earned!"}</h2><p className="text-4xl font-bold text-primary">{finalResult.score}%</p><p>First-try accuracy · {finalResult.correct} of {finalResult.total} correct</p></div><Button className="w-full min-h-[52px]" onClick={onBack}>Continue</Button></>}
  </div>;
  if (!current) return null;
  const missCount = (state.misses[current.id] || 0) + (feedback && !feedback.is_correct ? 1 : 0);
  // TODO: non-multiple-choice exercises need their own safe server contracts; keep the existing fallback.
  return <div className="space-y-4">
    <div className="space-y-1 relative">
      <QuizCombo combo={state.combo} />
      <div className="flex justify-between items-center text-xs text-muted-foreground"><span>{moduleTitle}</span><span>{state.mastered.length}/{ordered.length}</span><Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="Leave badge check" onClick={() => requestLeave.current()}><X /></Button></div>
      <div role="progressbar" aria-label="Questions mastered" aria-valuenow={state.mastered.length} aria-valuemax={ordered.length} className="flex gap-0.5 h-1.5">
        {ordered.map((_, i) => <div key={i} className={cn("flex-1 rounded-full", i < state.mastered.length ? state.combo >= 5 ? "quiz-progress-gold" : "bg-learn-info" : "bg-muted")} />)}
      </div>
    </div>
    <div className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-primary" /><span className="text-xs font-semibold text-primary uppercase tracking-wider">Multiple Choice</span>
      {state.misses[current.id] > 0 && <m.span key={attempt} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0.1 : duration.fast }} className="text-sm text-muted-foreground">Let's revisit</m.span>}
    </div>
    <div className="space-y-4"><div className="flex items-start gap-4"><p className="text-lg font-medium leading-relaxed flex-1">{current.question}</p>{!feedback && <GuideArt name="guide-thinking" size={72} className="learn-info-icon"/>}</div>
      <RadioGroup key={`${current.id}:${attempt}`} value={selected === null ? "" : String(selected)} onValueChange={v => { if (!feedback && !pending && !error) setSelected(Number(v)); }} className="space-y-2">
        {optionOrder.map((originalIndex, displayIndex) => {
          const correct = feedback && originalIndex === feedback.correct_answer;
          const missed = feedback && selected === originalIndex && !feedback.is_correct;
          return <m.div key={originalIndex} animate={correct && !reduced ? { scale: [1, 1.03, 1] } : { scale: 1 }} transition={{ duration: duration.fast }}
            className={cn("flex items-center gap-3 p-3 rounded-lg border-2 min-h-11", !feedback && selected === originalIndex ? "border-primary bg-primary/10" : "border-border bg-card", correct && "quiz-option-success", missed && "quiz-option-miss")}>
            <RadioGroupItem value={String(originalIndex)} id={`q-${current.id}-${displayIndex}`} disabled={!!feedback || pending || error} />
            <Label htmlFor={`q-${current.id}-${displayIndex}`} className="flex-1 min-h-11 flex items-center cursor-pointer text-base">{current.options[originalIndex]}</Label>
            {correct && <CheckCircle2 className="h-5 w-5 quiz-feedback-success shrink-0" />}{missed && <XCircle className="h-5 w-5 quiz-feedback-miss shrink-0" />}
          </m.div>;
        })}
      </RadioGroup>
      <Button className="w-full min-h-[52px]" disabled={selected === null || pending || !!feedback || error} onClick={() => { if (selected !== null) void check(current.id, selected, Date.now() - start.current); }} aria-label={pending ? "Checking your answer" : "Check"}>{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Check</Button>
      {error && <div role="alert"><p>We couldn't check that answer. Try again.</p><Button variant="outline" className="min-h-11" onClick={retry} disabled={pending}>Retry</Button></div>}
    </div>
    <QuizFeedbackSheet feedback={rereadOpen ? null : feedback} correctOption={feedback ? current.options[feedback.correct_answer] : ""} onContinue={handleContinue} reread={missCount >= 3 && current.section_id ? () => void loadLesson() : undefined} />
    <BottomSheet open={rereadOpen} onOpenChange={setRereadOpen} title={lesson?.title || "Reread this lesson"}>{lessonError ? <><p>We couldn't load this lesson.</p><Button onClick={() => void loadLesson()}>Try again</Button></> : lesson ? <>{renderMarkdown(lesson.content_text || "")}<GlossarySheet floating /></> : <Loader2 className="animate-spin" aria-label="Loading lesson" />}</BottomSheet>
    <BottomSheet open={leave} onOpenChange={setLeave} title="Leave the badge check? You'll start it again next time." initialFocusRef={keepButton}>
      <div className="space-y-3"><Button ref={keepButton} className="w-full min-h-[52px]" onClick={() => setLeave(false)}>Keep going</Button><Button variant="ghost" className="w-full min-h-11" onClick={onBack}>Leave</Button></div>
    </BottomSheet>
  </div>;
};
