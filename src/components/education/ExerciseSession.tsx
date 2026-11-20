import { useState, useEffect } from "react";
import { useQuizAnswer } from "@/hooks/useQuizAnswer";
import type { QuizAnswer, QuizResult } from "@/lib/quizAnswers";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Button } from "@/components/ui/button";
import { CelebrationEngine, CelebrationTier } from "@/components/celebrations/CelebrationEngine";
import { MascotReaction } from "@/components/mascot/MascotReaction";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Trophy, Zap, Loader2 } from "lucide-react";

interface ExerciseQuestion {
  id: string;
  question: string;
  options: string[];
  exercise_type: string;
  order_index: number;
}

interface ExerciseSessionProps {
  moduleId: string;
  moduleTitle: string;
  questions: ExerciseQuestion[];
  userId: string;
  onComplete: (score: number, correct: number, total: number, passed: boolean, answers: QuizAnswer[]) => void;
  finalResult: QuizResult | null;
  submitting: boolean;
  submissionError: boolean;
  onRetrySubmit: () => void;
  onBack: () => void;
  preserveQuestionOrder?: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export const ExerciseSession = ({
  moduleId,
  moduleTitle,
  questions: rawQuestions,
  userId,
  onComplete,
  onBack,
  finalResult, submitting, submissionError, onRetrySubmit, preserveQuestionOrder = false,
}: ExerciseSessionProps) => {
  const reducedMotion = useReducedMotion();

  // TODO: server-side grading for this exercise type is not built yet.
  // All exercise types currently use the multiple-choice server contract.
  const [sessionQuestions] = useState(() => preserveQuestionOrder ? rawQuestions : shuffle(rawQuestions));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<{ questionId: string; isCorrect: boolean; timeTakenMs: number; selectedAnswer: number }[]>([]);
  const [showScore, setShowScore] = useState(false);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);

  // MC state
  const [mcSelected, setMcSelected] = useState<number | null>(null);
  const [mcStartTime, setMcStartTime] = useState(Date.now());

  // Celebration
  const [celebrationTier, setCelebrationTier] = useState<CelebrationTier>("micro");
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);

  const { pending, feedback, error, check, retry, reset } = useQuizAnswer();
  const current = sessionQuestions[currentIdx];

  useEffect(() => {
    if (!finalResult) return;
    setCelebrationTier(finalResult.score === 100 ? "medium" : finalResult.passed ? "small" : "micro");
    if (finalResult.passed || finalResult.score >= 60) setCelebrationTrigger(t => t + 1);
  }, [finalResult]);

  const handleMcAnswer = () => {
    if (!current || mcSelected === null || feedback || pending) return;
    void check(current.id, mcSelected, Date.now() - mcStartTime);
  };

  const handleMcContinue = () => {
    if (!current || !feedback || mcSelected === null) return;
    const newResults = [...results, { questionId: current.id, selectedAnswer: mcSelected, isCorrect: feedback.is_correct, timeTakenMs: Date.now() - mcStartTime }];
    setResults(newResults);
    if (feedback.is_correct) { setConsecutiveCorrect(c => c + 1); setConsecutiveWrong(0); }
    else { setConsecutiveWrong(c => c + 1); setConsecutiveCorrect(0); }
    if (currentIdx < sessionQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setMcSelected(null);
      reset();
      setMcStartTime(Date.now());
    } else {
      setShowScore(true);
      const correct = newResults.filter(r => r.isCorrect).length;
      onComplete(Math.round(correct / sessionQuestions.length * 100), correct, sessionQuestions.length, false,
        newResults.map(r => ({ question_id: r.questionId, selected_answer: r.selectedAnswer })));
    }
  };
  const mcAnswered = feedback !== null;

  // Score screen
  if (showScore) {
    if (!finalResult) return (
      <div className="space-y-4 py-4" aria-live="polite">
        {submissionError ? <>
          <p>We couldn't save your quiz. Try again.</p>
          <Button onClick={onRetrySubmit} disabled={submitting}>Try again</Button>
        </> : <Loader2 className="h-5 w-5 animate-spin" aria-label="Saving your quiz" />}
      </div>
    );
    const { correct: totalCorrect, score: scorePercent, passed } = finalResult;

    return (
      <div className="space-y-6 py-4">
        <CelebrationEngine tier={celebrationTier} trigger={celebrationTrigger} title={scorePercent === 100 ? "Perfect Score! 🏆" : passed ? "Great Work! 🎉" : undefined} />

        <div className="text-center space-y-4">
          {passed ? (
            <Trophy className="h-16 w-16 text-primary mx-auto" />
          ) : (
            <MascotReaction emotion="empathetic" size="large" position="inline" message="You'll get it next time!" />
          )}

          <h2 className="text-2xl font-bold">{passed ? "Quiz Passed!" : "Keep Learning!"}</h2>
          <div className="text-5xl font-bold text-primary">{scorePercent}%</div>
          <p className="text-muted-foreground">
            {totalCorrect} of {sessionQuestions.length} correct
          </p>

          {/* Colored progress bar showing results */}
          <div className="flex gap-0.5 mx-auto max-w-xs">
            {results.map((r, i) => (
              <div
                key={i}
                className={cn(
                  "h-3 rounded-full flex-1",
                  r.isCorrect ? "bg-green-500" : "bg-destructive"
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {!passed && (
            <Button onClick={onBack} variant="outline" className="w-full rounded-xl">
              Review Material
            </Button>
          )}
          <Button onClick={onBack} className="w-full rounded-xl">
            {passed ? "Continue" : "Back to Module"}
          </Button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  // Render based on exercise type
  const renderExercise = () => {
    {
        const isCorrectAnswer = feedback?.is_correct === true;
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium leading-relaxed">{current.question}</p>
            <RadioGroup
              key={current.id}
              value={mcSelected !== null ? mcSelected.toString() : ""}
              onValueChange={(v) => !mcAnswered && !pending && !error && setMcSelected(parseInt(v))}
              className="space-y-2"
            >
              {current.options.map((opt, idx) => {
                const showCorrect = mcAnswered && idx === feedback?.correct_answer;
                const showWrong = mcAnswered && mcSelected === idx && !isCorrectAnswer;

                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 transition-all min-h-[44px]",
                      !mcAnswered && mcSelected === idx && "border-primary bg-primary/10",
                      !mcAnswered && mcSelected !== idx && "border-border bg-card",
                      showCorrect && "border-green-500 bg-green-500/10",
                      showWrong && "border-destructive bg-destructive/10"
                    )}
                  >
                    <RadioGroupItem value={idx.toString()} id={`q-${current.id}-${idx}`} disabled={mcAnswered || pending || error} />
                    <Label htmlFor={`q-${current.id}-${idx}`} className="flex-1 cursor-pointer text-sm">
                      {opt}
                    </Label>
                    {showCorrect && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {showWrong && <XCircle className="h-5 w-5 text-destructive" />}
                  </div>
                );
              })}
            </RadioGroup>

            {/* Feedback */}
            {mcAnswered && (
              <div aria-live="polite" className={cn(
                "rounded-xl p-4 border",
                isCorrectAnswer ? "bg-green-500/5 border-green-500/20" : "bg-destructive/5 border-destructive/20",
                !reducedMotion && "animate-fade-in"
              )}>
                <MascotReaction emotion={isCorrectAnswer ? "cheering" : "empathetic"} size="small" position="inline" />
                <p className="text-sm font-semibold mb-1">
                  {isCorrectAnswer ? <><CheckCircle2 className="inline h-5 w-5" /> Correct</> : <><XCircle className="inline h-5 w-5" /> Not quite</>}
                </p>
                <p className="text-sm">{feedback?.explanation}</p>
              </div>
            )}

            {!mcAnswered && mcSelected !== null && (
              <Button onClick={handleMcAnswer} disabled={pending || error} className="w-full rounded-xl" size="lg">{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-label="Checking your answer" />}Check</Button>
            )}
            {error && <div role="alert"><p>We couldn't check that answer. Try again.</p><Button variant="outline" onClick={retry} disabled={pending}>Retry</Button></div>}
            {mcAnswered && (
              <Button onClick={handleMcContinue} className="w-full rounded-xl" size="lg">Continue</Button>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{moduleTitle}</span>
          <span>{results.length + 1}/{sessionQuestions.length}</span>
        </div>
        <div className="flex gap-0.5 h-1.5">
          {sessionQuestions.map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-full",
                i < results.length && results[i]?.isCorrect && "bg-green-500",
                i < results.length && results[i] && !results[i].isCorrect && "bg-destructive",
                i === currentIdx && "bg-primary",
                i > currentIdx && !(i < results.length) && "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Exercise type badge */}
      <div className="flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">
          Multiple Choice
        </span>

        {/* Adaptive difficulty indicator */}
        {consecutiveCorrect >= 3 && (
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">🔥 On fire!</span>
        )}
      </div>

      {/* Exercise content */}
      {renderExercise()}
    </div>
  );
};
