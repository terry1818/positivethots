import { useState } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Button } from "@/components/ui/button";
import { GripVertical, Check, X, ArrowDown } from "lucide-react";

interface ReorderExerciseProps {
  instruction: string;
  items: string[];
  correctOrder: number[]; // Array of original indices in correct sequence
  explanation?: string;
  onComplete: (isCorrect: boolean, timeTakenMs: number) => void;
}

function shuffleIndices(length: number): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const ReorderExercise = ({
  instruction,
  items,
  correctOrder,
  explanation,
  onComplete,
}: ReorderExerciseProps) => {
  const reducedMotion = useReducedMotion();
  const [order, setOrder] = useState<number[]>(() => shuffleIndices(items.length));
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [startTime] = useState(Date.now());

  // Determine per-position correctness
  const positionCorrect = order.map((itemIdx, pos) => correctOrder[pos] === itemIdx);
  const allCorrect = positionCorrect.every(Boolean);

  const handleTap = (positionIdx: number) => {
    if (checked) return;

    if (selectedIdx === null) {
      setSelectedIdx(positionIdx);
    } else if (selectedIdx === positionIdx) {
      setSelectedIdx(null);
    } else {
      // Swap
      const newOrder = [...order];
      [newOrder[selectedIdx], newOrder[positionIdx]] = [newOrder[positionIdx], newOrder[selectedIdx]];
      setOrder(newOrder);
      setSelectedIdx(null);
    }
  };

  const handleCheck = () => {
    setChecked(true);
  };

  const handleContinue = () => {
    const timeTaken = Date.now() - startTime;
    onComplete(allCorrect, timeTaken);
  };

  return (
    <div className="space-y-4">
      {/* Instruction */}
      <p className="text-foreground font-medium leading-relaxed">{instruction}</p>
      <p className="text-xs text-muted-foreground">Tap an item to select it, then tap another to swap positions</p>

      {/* Reorderable items */}
      <div className="space-y-2">
        {order.map((itemIdx, posIdx) => {
          const isSelected = selectedIdx === posIdx;
          const isRight = checked && positionCorrect[posIdx];
          const isWrong = checked && !positionCorrect[posIdx];

          return (
            <button
              key={`pos-${posIdx}`}
              onClick={() => handleTap(posIdx)}
              disabled={checked}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left min-h-[44px]",
                !checked && isSelected && "ring-2 ring-primary bg-primary/10 border-primary",
                !checked && !isSelected && "border-border bg-card hover:border-primary/30",
                isRight && "border-green-500 bg-green-500/10",
                isWrong && !reducedMotion && "border-destructive bg-destructive/10 animate-shake",
                isWrong && reducedMotion && "border-destructive bg-destructive/10"
              )}
              aria-label={`Position ${posIdx + 1}: ${items[itemIdx]}${isSelected ? " (selected)" : ""}`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                isRight && "bg-green-600 text-white",
                isWrong && "bg-destructive text-white",
                !checked && "bg-primary/20 text-primary"
              )}>
                {isRight ? <Check className="h-3.5 w-3.5" /> :
                 isWrong ? <X className="h-3.5 w-3.5" /> :
                 posIdx + 1}
              </span>
              <span className="flex-1">{items[itemIdx]}</span>
              {isWrong && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowDown className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {checked && explanation && (
        <div className={cn(
          "rounded-xl p-4 bg-primary/5 border border-primary/20",
          !reducedMotion && "animate-fade-in"
        )}>
          <p className="text-sm font-semibold text-primary mb-1">
            {allCorrect ? "✓ Perfect order!" : "Correct order explained:"}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>
        </div>
      )}

      {/* Action buttons */}
      {!checked && (
        <Button onClick={handleCheck} className="w-full rounded-xl" size="lg">
          Check Order
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
