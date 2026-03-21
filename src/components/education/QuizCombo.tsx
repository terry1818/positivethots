import { cn } from "@/lib/utils";
import { Flame, Zap } from "lucide-react";

interface QuizComboProps {
  combo: number;
  maxCombo: number;
}

export const QuizCombo = ({ combo }: QuizComboProps) => {
  if (combo < 2) return null;

  const intensity = combo >= 5 ? "inferno" : combo >= 3 ? "blazing" : "warm";

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-sm transition-all animate-bounce-in",
      intensity === "inferno"
        ? "bg-primary/20 text-primary animate-heartbeat"
        : intensity === "blazing"
        ? "bg-accent/20 text-accent"
        : "bg-muted text-muted-foreground"
    )}>
      {intensity === "inferno" ? (
        <Zap className="h-4 w-4 animate-pulse" />
      ) : (
        <Flame className="h-4 w-4" />
      )}
      <span>COMBO x{combo}!</span>
      {combo >= 5 && <span className="text-xs">🔥</span>}
    </div>
  );
};
