import { useState } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Drama } from "lucide-react";

interface ScenarioExerciseProps {
  scenario: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  onComplete: (isCorrect: boolean, timeTakenMs: number) => void;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export const ScenarioExercise = ({
  scenario,
  options,
  correctAnswer,
  explanation,
  onComplete,
}: ScenarioExerciseProps) => {
  const reducedMotion = useReducedMotion();
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [startTime] = useState(Date.now());

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
  };

  const handleCheck = () => {
    if (selected === null || answered) return;
    setAnswered(true);
  };

  const handleContinue = () => {
    const timeTaken = Date.now() - startTime;
    onComplete(selected === correctAnswer, timeTaken);
  };

  const isCorrect = selected === correctAnswer;

  return (
    <div className="space-y-4">
      {/* Scenario card */}
      <div className="relative rounded-xl p-4 bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <Drama className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Scenario</span>
        </div>
        <p className="text-foreground leading-relaxed whitespace-pre-line">{scenario}</p>
      </div>

      {/* Response options */}
      <div className="space-y-2">
        {options.map((opt, idx) => {
          const isThis = selected === idx;
          const showCorrect = answered && idx === correctAnswer;
          const showWrong = answered && isThis && !isCorrect;

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answered}
              className={cn(
                "w-full text-left p-4 rounded-xl border-2 transition-all min-h-[44px]",
                !answered && isThis && "border-primary bg-primary/10 ring-1 ring-primary/30",
                !answered && !isThis && "border-border hover:border-primary/40 bg-card",
                showCorrect && "border-green-500 bg-green-500/10",
                showWrong && !reducedMotion && "border-destructive bg-destructive/10 animate-shake",
                showWrong && reducedMotion && "border-destructive bg-destructive/10"
              )}
              aria-label={`Option ${LETTERS[idx]}: ${opt}`}
            >
              <div className="flex items-start gap-3">
                <span className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  showCorrect && "bg-green-500 text-white",
                  showWrong && "bg-destructive text-white",
                  !answered && isThis && "bg-primary text-primary-foreground",
                  !answered && !isThis && "bg-muted text-muted-foreground"
                )}>
                  {showCorrect ? <CheckCircle2 className="h-4 w-4" /> :
                   showWrong ? <XCircle className="h-4 w-4" /> :
                   LETTERS[idx]}
                </span>
                <span className="pt-1">{opt}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Explanation (after answering) */}
      {answered && explanation && (
        <div className={cn(
          "rounded-xl p-4 bg-primary/5 border border-primary/20",
          !reducedMotion && "animate-fade-in"
        )}>
          <p className="text-sm font-semibold text-primary mb-1">
            {isCorrect ? "✓ Great choice!" : "Why this is the best response:"}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>
        </div>
      )}

      {/* Action button */}
      {!answered && selected !== null && (
        <Button onClick={handleCheck} className="w-full rounded-xl" size="lg">
          Check Answer
        </Button>
      )}
      {answered && (
        <Button onClick={handleContinue} className="w-full rounded-xl" size="lg">
          Continue
        </Button>
      )}
    </div>
  );
};
