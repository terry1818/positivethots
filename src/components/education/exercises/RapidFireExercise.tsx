import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { comboExtraNotes } from "@/lib/soundGenerator";
import { reportError } from "@/lib/errorReporting";
import { PracticeFrame } from "../practice/PracticeFrame";
import { QuizFeedbackSheet } from "../QuizFeedbackSheet";
export interface RapidQuestion { id: string; question: string; option_text: string; option_index: number }
export const RapidFireExercise = ({ questions, timerOff = false, onComplete, onExit }: { questions: RapidQuestion[]; timerOff?: boolean; onComplete: (accuracy: number, total: number) => void; onExit: () => void }) => {
  const [index, setIndex] = useState(0); const [remaining, setRemaining] = useState(10); const [combo, setCombo] = useState(0);
  const [correct, setCorrect] = useState(0); const [skipped, setSkipped] = useState(0); const [pending, setPending] = useState(false); const [error, setError] = useState(false);
  const [feedback, setFeedback] = useState<{ is_correct: boolean; correct_option_text: string; explanation: string; skipped: boolean } | null>(null);
  const busy = useRef(false); const last = useRef<boolean | null>(null); const reduced = useReducedMotion();
  const { playCorrect, playMiss, playCombo } = useSoundEffects(); const current = questions[index];
  const check = useCallback(async (value: boolean | null) => {
    if (busy.current || feedback || !current) return; busy.current = true; last.current = value; setPending(true); setError(false);
    try { const { data, error } = await supabase.rpc("check_rapid_fire", { _question_id: current.id, _option_index: current.option_index, _claimed_true: value ?? false }); if (error) throw error;
      const result = data as unknown as { is_correct: boolean; correct_option_text: string; explanation: string };
      const right = value !== null && result.is_correct; setFeedback({ ...result, is_correct: right, skipped: value === null });
      if (value === null) setSkipped(n => n + 1); else if (!right) { playMiss(); setCombo(0); } else { if (comboExtraNotes(combo + 1)) playCombo(combo + 1); else playCorrect(); setCombo(n => n + 1); setCorrect(n => n + 1); }
    } catch (e) { setError(true); void reportError(e instanceof Error ? e : new Error("Rapid answer failed")); } finally { busy.current = false; setPending(false); }
  }, [current, feedback, combo, playCorrect, playMiss, playCombo]);
  useEffect(() => { if (timerOff || feedback || pending || error) return; const start = Date.now(); const interval = setInterval(() => { const left = Math.max(0, 10 - (Date.now() - start) / 1000); setRemaining(left); if (left === 0) { clearInterval(interval); void check(null); } }, 100); return () => clearInterval(interval); }, [index, timerOff, feedback, pending, error, check]);
  if (!current) return null;
  const next = () => { if (index === questions.length - 1) { onComplete(Math.round(correct / Math.max(1, questions.length - skipped) * 100), questions.length); return; } setIndex(n => n + 1); setFeedback(null); setRemaining(10); };
  return <PracticeFrame title="Rapid fire" current={index} total={questions.length} combo={combo} onExit={onExit}>{!timerOff && (reduced ? <p role="timer">{Math.ceil(remaining)} seconds</p> : <div className="h-1 rounded bg-muted overflow-hidden" aria-label={`${Math.ceil(remaining)} seconds remaining`}><div className="h-full bg-primary origin-left" style={{ transform: `scaleX(${remaining / 10})` }}/></div>)}<p className="text-lg font-medium">{current.question}</p><p className="practice-statement">{current.option_text}</p><p>Is this the right answer?</p><div className="grid grid-cols-2 gap-3"><Button className="practice-answer min-h-[72px] text-lg" disabled={pending || !!feedback || error} onClick={() => void check(true)}>True</Button><Button variant="outline" className="practice-answer min-h-[72px] text-lg" disabled={pending || !!feedback || error} onClick={() => void check(false)}>False</Button></div>{pending && <p role="status">Checking your answer…</p>}{error && <div role="alert"><p>We couldn't check that answer.</p><Button onClick={() => void check(last.current)}>Try again</Button></div>}{feedback?.skipped && <p role="status">Skipped — not counted as a miss.</p>}<QuizFeedbackSheet feedback={feedback ? { is_correct: feedback.is_correct, correct_answer: 0, explanation: feedback.skipped ? `Skipped. ${feedback.explanation}` : feedback.explanation } : null} correctOption={feedback?.correct_option_text || ""} onContinue={next}/></PracticeFrame>;
};
export default RapidFireExercise;
