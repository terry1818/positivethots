import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CelebrationEngine, CelebrationTier } from "@/components/celebrations/CelebrationEngine";
import { MascotReaction } from "@/components/mascot/MascotReaction";
import { DragMatchExercise } from "./exercises/DragMatchExercise";
import { ScenarioExercise } from "./exercises/ScenarioExercise";
import { RapidFireExercise } from "./exercises/RapidFireExercise";
import { FillBlankExercise } from "./exercises/FillBlankExercise";
import { ReorderExercise } from "./exercises/ReorderExercise";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";

interface ExerciseQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  exercise_type: string;
  match_pairs?: any[];
  correct_order?: number[];
  explanation?: string;
  explanation_correct?: string;
  explanation_wrong?: string;
  order_index: number;
}

interface ExerciseSessionProps {
  moduleId: string;
  moduleTitle: string;
  questions: ExerciseQuestion[];
  userId: string;
  onComplete: (score: number, correct: number, total: number, passed: boolean) => void;
  onBack: () => void;
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
}: ExerciseSessionProps) => {
  const reducedMotion = useReducedMotion();

  // Group rapid-fire questions together, shuffle the rest
  const [sessionQuestions] = useState<ExerciseQuestion[]>(() => {
    const rapidFire = rawQuestions.filter(q => q.exercise_type === "true_false_rapid");
    const others = rawQuestions.filter(q => q.exercise_type !== "true_false_rapid");
    const shuffled = shuffle(others);
    // Insert rapid-fire group at a random position (as one "round")
    if (rapidFire.length > 0) {
      const insertAt = Math.floor(Math.random() * (shuffled.length + 1));
      shuffled.splice(insertAt, 0, ...rapidFire);
    }
    return shuffled;
  });

  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<{ questionId: string; isCorrect: boolean; timeTakenMs: number }[]>([]);
  const [showScore, setShowScore] = useState(false);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);

  // MC state
  const [mcSelected, setMcSelected] = useState<number | null>(null);
  const [mcAnswered, setMcAnswered] = useState(false);
  const [mcStartTime, setMcStartTime] = useState(Date.now());

  // Celebration
  const [celebrationTier, setCelebrationTier] = useState<CelebrationTier>("micro");
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);

  // Track if we're inside a rapid-fire round
  const [rapidFireRound, setRapidFireRound] = useState<ExerciseQuestion[] | null>(null);

  const current = sessionQuestions[currentIdx];
  const totalQuestions = sessionQuestions.filter(q => q.exercise_type !== "true_false_rapid").length +
    (sessionQuestions.some(q => q.exercise_type === "true_false_rapid") ? 1 : 0); // Count rapid-fire as 1

  const progressPercent = showScore ? 100 : Math.round((results.length / sessionQuestions.length) * 100);

  // Record performance to database
  const recordPerformance = useCallback(async (questionId: string, isCorrect: boolean, timeTakenMs: number) => {
    try {
      await supabase.from("user_quiz_performance").insert({
        user_id: userId,
        question_id: questionId,
        module_id: moduleId,
        is_correct: isCorrect,
        time_taken_ms: timeTakenMs,
      });
    } catch (e) {
      console.error("Failed to record performance:", e);
    }
  }, [userId, moduleId]);

  const handleExerciseComplete = useCallback((questionId: string, isCorrect: boolean, timeTakenMs: number) => {
    const newResults = [...results, { questionId, isCorrect, timeTakenMs }];
    setResults(newResults);
    recordPerformance(questionId, isCorrect, timeTakenMs);

    if (isCorrect) {
      setConsecutiveCorrect(c => c + 1);
      setConsecutiveWrong(0);
    } else {
      setConsecutiveWrong(c => c + 1);
      setConsecutiveCorrect(0);
    }

    // Advance
    if (currentIdx < sessionQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setMcSelected(null);
      setMcAnswered(false);
      setMcStartTime(Date.now());
    } else {
      // Session complete
      const totalCorrect = newResults.filter(r => r.isCorrect).length;
      const scorePercent = Math.round((totalCorrect / sessionQuestions.length) * 100);
      setShowScore(true);

      // Determine celebration
      if (scorePercent === 100) {
        setCelebrationTier("medium");
        setCelebrationTrigger(t => t + 1);
      } else if (scorePercent >= 80) {
        setCelebrationTier("small");
        setCelebrationTrigger(t => t + 1);
      } else if (scorePercent >= 60) {
        setCelebrationTier("micro");
        setCelebrationTrigger(t => t + 1);
      }

      onComplete(scorePercent, totalCorrect, sessionQuestions.length, scorePercent >= 80);
    }
  }, [results, currentIdx, sessionQuestions, recordPerformance, onComplete]);

  // Handle rapid-fire round completion
  const handleRapidFireComplete = useCallback((roundResults: { questionId: string; isCorrect: boolean; timeTakenMs: number }[]) => {
    // Record all results
    roundResults.forEach(r => recordPerformance(r.questionId, r.isCorrect, r.timeTakenMs));

    const newResults = [...results, ...roundResults];
    setResults(newResults);

    const correctInRound = roundResults.filter(r => r.isCorrect).length;
    if (correctInRound === roundResults.length) {
      setConsecutiveCorrect(c => c + roundResults.length);
      setConsecutiveWrong(0);
    } else {
      setConsecutiveWrong(w => w + roundResults.filter(r => !r.isCorrect).length);
      setConsecutiveCorrect(0);
    }

    // Advance past all rapid-fire questions
    const rfCount = sessionQuestions.filter(q => q.exercise_type === "true_false_rapid").length;
    const nextIdx = currentIdx + rfCount;

    if (nextIdx < sessionQuestions.length) {
      setCurrentIdx(nextIdx);
      setMcSelected(null);
      setMcAnswered(false);
      setMcStartTime(Date.now());
    } else {
      const totalCorrect = newResults.filter(r => r.isCorrect).length;
      const scorePercent = Math.round((totalCorrect / sessionQuestions.length) * 100);
      setShowScore(true);
      if (scorePercent === 100) { setCelebrationTier("medium"); setCelebrationTrigger(t => t + 1); }
      else if (scorePercent >= 80) { setCelebrationTier("small"); setCelebrationTrigger(t => t + 1); }
      else if (scorePercent >= 60) { setCelebrationTier("micro"); setCelebrationTrigger(t => t + 1); }
      onComplete(scorePercent, totalCorrect, sessionQuestions.length, scorePercent >= 80);
    }
  }, [results, currentIdx, sessionQuestions, recordPerformance, onComplete]);

  // MC: handle answer
  const handleMcAnswer = () => {
    if (mcSelected === null || mcAnswered) return;
    setMcAnswered(true);
  };

  const handleMcContinue = () => {
    const timeTaken = Date.now() - mcStartTime;
    const isCorrect = mcSelected === current.correct_answer;
    handleExerciseComplete(current.id, isCorrect, timeTaken);
  };

  // Score screen
  if (showScore) {
    const totalCorrect = results.filter(r => r.isCorrect).length;
    const scorePercent = Math.round((totalCorrect / sessionQuestions.length) * 100);
    const passed = scorePercent >= 80;

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
    switch (current.exercise_type) {
      case "drag_match":
        if (!current.match_pairs || !Array.isArray(current.match_pairs)) {
          return <p className="text-muted-foreground">Exercise data missing</p>;
        }
        return (
          <DragMatchExercise
            pairs={current.match_pairs}
            onComplete={(isCorrect, timeTakenMs) => handleExerciseComplete(current.id, isCorrect, timeTakenMs)}
          />
        );

      case "scenario_choice":
        return (
          <ScenarioExercise
            scenario={current.question}
            options={current.options}
            correctAnswer={current.correct_answer}
            explanation={current.explanation || current.explanation_correct}
            onComplete={(isCorrect, timeTakenMs) => handleExerciseComplete(current.id, isCorrect, timeTakenMs)}
          />
        );

      case "true_false_rapid": {
        // Collect all consecutive rapid-fire questions starting from current
        const rfQuestions: ExerciseQuestion[] = [];
        for (let i = currentIdx; i < sessionQuestions.length && sessionQuestions[i].exercise_type === "true_false_rapid"; i++) {
          rfQuestions.push(sessionQuestions[i]);
        }
        return (
          <RapidFireExercise
            questions={rfQuestions.map(q => ({
              id: q.id,
              statement: q.question,
              correctAnswer: q.correct_answer,
            }))}
            onComplete={handleRapidFireComplete}
          />
        );
      }

      case "fill_blank":
        return (
          <FillBlankExercise
            sentence={current.question}
            options={current.options}
            correctAnswer={current.correct_answer}
            explanation={current.explanation || current.explanation_correct}
            onComplete={(isCorrect, timeTakenMs) => handleExerciseComplete(current.id, isCorrect, timeTakenMs)}
          />
        );

      case "reorder":
        if (!current.correct_order || !Array.isArray(current.correct_order)) {
          return <p className="text-muted-foreground">Exercise data missing</p>;
        }
        return (
          <ReorderExercise
            instruction={current.question}
            items={current.options}
            correctOrder={current.correct_order}
            explanation={current.explanation || current.explanation_correct}
            onComplete={(isCorrect, timeTakenMs) => handleExerciseComplete(current.id, isCorrect, timeTakenMs)}
          />
        );

      case "multiple_choice":
      default: {
        const isCorrectAnswer = mcSelected === current.correct_answer;
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium leading-relaxed">{current.question}</p>
            <RadioGroup
              value={mcSelected?.toString()}
              onValueChange={(v) => !mcAnswered && setMcSelected(parseInt(v))}
              className="space-y-2"
            >
              {current.options.map((opt, idx) => {
                const showCorrect = mcAnswered && idx === current.correct_answer;
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
                    <RadioGroupItem value={idx.toString()} id={`q-${current.id}-${idx}`} disabled={mcAnswered} />
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
              <div className={cn(
                "rounded-xl p-4 border",
                isCorrectAnswer ? "bg-green-500/5 border-green-500/20" : "bg-destructive/5 border-destructive/20",
                !reducedMotion && "animate-fade-in"
              )}>
                <p className="text-sm font-semibold mb-1">
                  {isCorrectAnswer
                    ? (current.explanation_correct || "✓ Correct!")
                    : (current.explanation_wrong || "✗ Not quite.")}
                </p>
              </div>
            )}

            {!mcAnswered && mcSelected !== null && (
              <Button onClick={handleMcAnswer} className="w-full rounded-xl" size="lg">Check</Button>
            )}
            {mcAnswered && (
              <Button onClick={handleMcContinue} className="w-full rounded-xl" size="lg">Continue</Button>
            )}
          </div>
        );
      }
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
          {current.exercise_type === "multiple_choice" ? "Multiple Choice" :
           current.exercise_type === "drag_match" ? "Match Pairs" :
           current.exercise_type === "scenario_choice" ? "Scenario" :
           current.exercise_type === "true_false_rapid" ? "Rapid Fire" :
           current.exercise_type === "fill_blank" ? "Fill in the Blank" :
           current.exercise_type === "reorder" ? "Put in Order" : "Exercise"}
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
