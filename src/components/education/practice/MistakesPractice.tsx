import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuizAnswer } from "@/hooks/useQuizAnswer";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { practiceQueue } from "@/lib/practiceHub";
import { comboExtraNotes } from "@/lib/soundGenerator";
import { QuizFeedbackSheet } from "../QuizFeedbackSheet";
import { PracticeFrame } from "./PracticeFrame";

export interface MistakeQuestion { id: string; question: string; options: string[] }
export default function MistakesPractice({ questions, onComplete, onExit }: { questions: MistakeQuestion[]; onComplete: (accuracy: number, total: number) => void; onExit: () => void }) {
  const [queue, setQueue] = useState(questions.map((_, i) => i));
  const [repeated, setRepeated] = useState(new Set<number>());
  const [combo, setCombo] = useState(0); const [right, setRight] = useState(0); const [attempts, setAttempts] = useState(0);
  const { check, pending, feedback, error, retry, reset } = useQuizAnswer();
  const start = useRef(Date.now()); const played = useRef(false);
  const { playCorrect, playMiss, playCombo } = useSoundEffects();
  const current = questions[queue[0]];
  useEffect(() => { if (feedback && !played.current) { played.current = true; if (!feedback.is_correct) playMiss(); else if (comboExtraNotes(combo + 1)) playCombo(combo + 1); else playCorrect(); } }, [feedback, combo, playCorrect, playMiss, playCombo]);
  const next = () => {
    if (!feedback) return;
    const updated = practiceQueue(queue, repeated, !feedback.is_correct);
    const correct = right + Number(feedback.is_correct), count = attempts + 1;
    setCombo(feedback.is_correct ? combo + 1 : 0); setRight(correct); setAttempts(count);
    if (!updated.queue.length) { onComplete(Math.round(correct / count * 100), count); return; }
    setQueue(updated.queue); setRepeated(updated.repeated); reset(); played.current = false; start.current = Date.now();
  };
  if (!current) return null;
  return <PracticeFrame title="Mistakes" current={questions.length - queue.length + repeated.size} total={questions.length + repeated.size} combo={combo} onExit={onExit}><p className="text-lg font-medium leading-relaxed">{current.question}</p><div className="space-y-3">{current.options.map((option, i) => <Button key={i} variant="outline" className="w-full h-auto min-h-[56px] whitespace-normal text-left justify-start" disabled={pending || !!feedback || error} onClick={() => void check(current.id, i, Date.now() - start.current)}>{option}</Button>)}</div>{pending && <p role="status">Checking your answer…</p>}{error && <div role="alert"><p>We couldn't check that answer. Try again.</p><Button onClick={retry}>Try again</Button></div>}<QuizFeedbackSheet feedback={feedback} correctOption={feedback ? current.options[feedback.correct_answer] : ""} onContinue={next}/></PracticeFrame>;
}