import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Button } from "@/components/ui/button";
import { Check, X, Zap } from "lucide-react";

interface RapidQuestion {
  id: string;
  statement: string;
  correctAnswer: number; // 0=True, 1=False
}

interface RapidFireExerciseProps {
  questions: RapidQuestion[];
  timePerQuestion?: number; // seconds
  onComplete: (results: { questionId: string; isCorrect: boolean; timeTakenMs: number }[]) => void;
}

export const RapidFireExercise = ({
  questions,
  timePerQuestion = 10,
  onComplete,
}: RapidFireExerciseProps) => {
  const reducedMotion = useReducedMotion();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<{ questionId: string; isCorrect: boolean; timeTakenMs: number }[]>([]);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [questionStart, setQuestionStart] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [done, setDone] = useState(false);

  const current = questions[currentIdx];

  // Timer
  useEffect(() => {
    if (answered || done) return;
    setTimeLeft(timePerQuestion);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0.1) {
          // Time up — mark wrong
          handleAnswer(-1);
          return 0;
        }
        return t - 0.1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [currentIdx, answered, done]);

  const handleAnswer = useCallback((answer: number) => {
    if (answered || done) return;
    const timeTaken = Date.now() - questionStart;
    const isCorrect = answer === current.correctAnswer;
    setSelectedAnswer(answer);
    setAnswered(true);

    const newResults = [...results, { questionId: current.id, isCorrect, timeTakenMs: timeTaken }];
    setResults(newResults);

    const delay = isCorrect ? 800 : 1500;
    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(currentIdx + 1);
        setAnswered(false);
        setSelectedAnswer(null);
        setQuestionStart(Date.now());
      } else {
        setDone(true);
        onComplete(newResults);
      }
    }, delay);
  }, [answered, done, current, currentIdx, questions.length, questionStart, results, onComplete]);

  if (done) {
    const correct = results.filter(r => r.isCorrect).length;
    return (
      <div className="text-center space-y-4 py-8">
        <Zap className="h-12 w-12 text-primary mx-auto" />
        <h3 className="text-xl font-bold">Rapid Fire Complete!</h3>
        <p className="text-2xl font-bold text-primary">{correct}/{questions.length}</p>
        <p className="text-muted-foreground">
          {correct === questions.length ? "Perfect! 🔥" :
           correct >= questions.length * 0.8 ? "Great job! 💪" :
           "Keep practicing! 📚"}
        </p>
      </div>
    );
  }

  const isCorrect = selectedAnswer === current.correctAnswer;
  const timerPercent = (timeLeft / timePerQuestion) * 100;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Rapid Fire</span>
        </div>
        <span className="text-sm text-muted-foreground">{currentIdx + 1}/{questions.length}</span>
      </div>

      {/* Timer bar */}
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            timerPercent > 50 ? "bg-primary" : timerPercent > 25 ? "bg-yellow-500" : "bg-destructive"
          )}
          style={{ width: `${timerPercent}%`, transition: answered ? "none" : "width 0.1s linear" }}
        />
      </div>

      {/* Statement */}
      <div className={cn(
        "rounded-xl p-6 bg-card border border-border text-center min-h-[120px] flex items-center justify-center",
        !reducedMotion && !answered && "animate-fade-in"
      )}>
        <p className="text-lg font-medium leading-relaxed">{current.statement}</p>
      </div>

      {/* True/False buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => handleAnswer(0)}
          disabled={answered}
          size="lg"
          className={cn(
            "h-16 text-lg font-bold rounded-xl transition-all",
            !answered && "bg-green-900/30 hover:bg-green-800/50 text-green-300 border border-green-700/30",
            answered && selectedAnswer === 0 && isCorrect && "bg-green-600 text-white",
            answered && selectedAnswer === 0 && !isCorrect && (!reducedMotion ? "bg-destructive text-white animate-shake" : "bg-destructive text-white"),
            answered && selectedAnswer !== 0 && current.correctAnswer === 0 && "bg-green-600/50 text-white ring-2 ring-green-400"
          )}
          aria-label="True"
        >
          <Check className="h-5 w-5 mr-2" /> TRUE
        </Button>
        <Button
          onClick={() => handleAnswer(1)}
          disabled={answered}
          size="lg"
          className={cn(
            "h-16 text-lg font-bold rounded-xl transition-all",
            !answered && "bg-red-900/30 hover:bg-red-800/50 text-red-300 border border-red-700/30",
            answered && selectedAnswer === 1 && isCorrect && "bg-green-600 text-white",
            answered && selectedAnswer === 1 && !isCorrect && (!reducedMotion ? "bg-destructive text-white animate-shake" : "bg-destructive text-white"),
            answered && selectedAnswer !== 1 && current.correctAnswer === 1 && "bg-green-600/50 text-white ring-2 ring-green-400"
          )}
          aria-label="False"
        >
          <X className="h-5 w-5 mr-2" /> FALSE
        </Button>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5">
        {questions.map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full",
              i < results.length && results[i].isCorrect && "bg-green-500",
              i < results.length && !results[i].isCorrect && "bg-destructive",
              i === currentIdx && "bg-primary",
              i > currentIdx && "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
};
