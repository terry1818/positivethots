import { useState } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

interface FillBlankExerciseProps {
  sentence: string; // Contains "___" for the blank
  options: string[];
  correctAnswer: number;
  explanation?: string;
  onComplete: (isCorrect: boolean, timeTakenMs: number) => void;
}

export const FillBlankExercise = ({
  sentence,
  options,
  correctAnswer,
  explanation,
  onComplete,
}: FillBlankExerciseProps) => {
  const reducedMotion = useReducedMotion();
  const [selectedWord, setSelectedWord] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [startTime] = useState(Date.now());

  const isCorrect = selectedWord === correctAnswer;

  // Split sentence around "___"
  const parts = sentence.split("___");

  const handleCheck = () => {
    if (selectedWord === null) return;
    setChecked(true);
  };

  const handleContinue = () => {
    const timeTaken = Date.now() - startTime;
    onComplete(isCorrect, timeTaken);
  };

  return (
    <div className="space-y-5">
      {/* Sentence with blank */}
      <div className="rounded-xl p-5 bg-card border border-border">
        <p className="text-lg leading-relaxed">
          {parts[0]}
          <span
            className={cn(
              "inline-block min-w-[80px] mx-1 px-3 py-1 rounded-lg text-center font-semibold border-2 border-dashed transition-all",
              !checked && selectedWord === null && "border-primary/50 text-primary/50 animate-pulse",
              !checked && selectedWord !== null && "border-primary bg-primary/10 text-primary",
              checked && isCorrect && "border-green-500 bg-green-500/10 text-green-400",
              checked && !isCorrect && "border-destructive bg-destructive/10 text-destructive"
            )}
          >
            {selectedWord !== null ? options[selectedWord] : "___"}
            {checked && isCorrect && <CheckCircle2 className="inline h-4 w-4 ml-1" />}
            {checked && !isCorrect && <XCircle className="inline h-4 w-4 ml-1" />}
          </span>
          {parts[1]}
        </p>
      </div>

      {/* Word bank */}
      <div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
          Word Bank
        </span>
        <div className="flex flex-wrap gap-2">
          {options.map((word, idx) => {
            const isSelected = selectedWord === idx;
            const showCorrectHighlight = checked && idx === correctAnswer;
            const showWrongHighlight = checked && isSelected && !isCorrect;

            return (
              <button
                key={idx}
                onClick={() => !checked && setSelectedWord(idx)}
                disabled={checked}
                className={cn(
                  "px-4 py-2 rounded-full border-2 transition-all text-sm font-medium min-h-[44px]",
                  !checked && isSelected && "border-primary bg-primary/20 text-primary",
                  !checked && !isSelected && "border-muted-foreground/20 bg-muted/30 hover:border-primary/40 text-foreground",
                  showCorrectHighlight && "border-green-500 bg-green-500/20 text-green-400",
                  showWrongHighlight && "border-destructive bg-destructive/20 text-destructive"
                )}
                aria-label={`Word option: ${word}${isSelected ? " (selected)" : ""}`}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation */}
      {checked && explanation && (
        <div className={cn(
          "rounded-xl p-4 bg-primary/5 border border-primary/20",
          !reducedMotion && "animate-fade-in"
        )}>
          <p className="text-sm font-semibold text-primary mb-1">
            {isCorrect ? "✓ Correct!" : `The answer is: ${options[correctAnswer]}`}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>
        </div>
      )}

      {/* Action buttons */}
      {!checked && selectedWord !== null && (
        <Button onClick={handleCheck} className="w-full rounded-xl" size="lg">
          Check
        </Button>
      )}
      {checked && (
        <Button onClick={handleContinue} className="w-full rounded-xl" size="lg">
          Continue
        </Button>
      )}
    </div>
  );
};
