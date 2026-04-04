import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Check, X } from "lucide-react";

interface MatchPair {
  term: string;
  definition: string;
}

interface DragMatchExerciseProps {
  pairs: MatchPair[];
  onComplete: (isCorrect: boolean, timeTakenMs: number) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const DragMatchExercise = ({ pairs, onComplete }: DragMatchExerciseProps) => {
  const reducedMotion = useReducedMotion();
  const [shuffledTerms] = useState(() => shuffle(pairs.map((p, i) => ({ text: p.term, idx: i }))));
  const [shuffledDefs] = useState(() => shuffle(pairs.map((p, i) => ({ text: p.definition, idx: i }))));
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [matched, setMatched] = useState<Map<number, number>>(new Map()); // termIdx -> defIdx
  const [wrongPair, setWrongPair] = useState<{ term: number; def: number } | null>(null);
  const [startTime] = useState(Date.now());

  const matchedTerms = new Set(matched.keys());
  const matchedDefs = new Set(matched.values());

  const handleTermTap = useCallback((idx: number) => {
    if (matchedTerms.has(idx)) return;
    setSelectedTerm(idx);
    setWrongPair(null);
  }, [matchedTerms]);

  const handleDefTap = useCallback((defIdx: number) => {
    if (matchedDefs.has(defIdx) || selectedTerm === null) return;

    // Check if this is a correct match
    if (selectedTerm === defIdx) {
      const newMatched = new Map(matched);
      newMatched.set(selectedTerm, defIdx);
      setMatched(newMatched);
      setSelectedTerm(null);
      setWrongPair(null);

      // Check if all matched
      if (newMatched.size === pairs.length) {
        const timeTaken = Date.now() - startTime;
        setTimeout(() => onComplete(true, timeTaken), 500);
      }
    } else {
      setWrongPair({ term: selectedTerm, def: defIdx });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedTerm(null);
      }, 1000);
    }
  }, [selectedTerm, matched, matchedDefs, pairs.length, startTime, onComplete]);

  return (
    <div className="space-y-4" role="group" aria-label="Match terms with definitions">
      <p className="text-sm text-muted-foreground text-center">
        Tap a term, then tap its matching definition
      </p>
      <div className="grid grid-cols-2 gap-3">
        {/* Terms column */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Terms</span>
          {shuffledTerms.map((t) => {
            const isMatched = matchedTerms.has(t.idx);
            const isSelected = selectedTerm === t.idx;
            const isWrong = wrongPair?.term === t.idx;
            return (
              <button
                key={`term-${t.idx}`}
                onClick={() => handleTermTap(t.idx)}
                disabled={isMatched}
                className={cn(
                  "w-full text-left p-3 rounded-lg border-2 transition-all text-sm min-h-[44px]",
                  isMatched && "opacity-50 border-primary/50 bg-primary/10",
                  isSelected && !isMatched && "ring-2 ring-primary scale-[1.02] border-primary bg-primary/20",
                  isWrong && !reducedMotion && "animate-shake border-destructive bg-destructive/10",
                  isWrong && reducedMotion && "border-destructive bg-destructive/10",
                  !isMatched && !isSelected && !isWrong && "border-primary/30 bg-primary/5 hover:border-primary/60"
                )}
                aria-label={`Term: ${t.text}${isMatched ? " (matched)" : ""}${isSelected ? " (selected)" : ""}`}
              >
                <div className="flex items-center gap-2">
                  {isMatched && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                  {isWrong && <X className="h-4 w-4 text-destructive flex-shrink-0" />}
                  <span>{t.text}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Definitions column */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Definitions</span>
          {shuffledDefs.map((d) => {
            const isMatched = matchedDefs.has(d.idx);
            const isWrong = wrongPair?.def === d.idx;
            return (
              <button
                key={`def-${d.idx}`}
                onClick={() => handleDefTap(d.idx)}
                disabled={isMatched || selectedTerm === null}
                className={cn(
                  "w-full text-left p-3 rounded-lg border-2 transition-all text-sm min-h-[44px]",
                  isMatched && "opacity-50 border-primary/50 bg-primary/10",
                  isWrong && !reducedMotion && "animate-shake border-destructive bg-destructive/10",
                  isWrong && reducedMotion && "border-destructive bg-destructive/10",
                  selectedTerm !== null && !isMatched && !isWrong && "border-muted-foreground/30 bg-muted/30 hover:border-primary/60 cursor-pointer",
                  (selectedTerm === null || isMatched) && !isWrong && "border-muted/30 bg-muted/10"
                )}
                aria-label={`Definition: ${d.text}${isMatched ? " (matched)" : ""}`}
              >
                <div className="flex items-center gap-2">
                  {isMatched && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                  {isWrong && <X className="h-4 w-4 text-destructive flex-shrink-0" />}
                  <span>{d.text}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="text-center text-sm text-muted-foreground">
        {matched.size} / {pairs.length} matched
      </div>
    </div>
  );
};
