import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";

interface StreakInterstitialProps {
  streak: number;
  hoursLeft: number;
  onSaveStreak: () => void;
  onDismiss: () => void;
}

export const StreakInterstitial = ({ streak, hoursLeft, onSaveStreak, onDismiss }: StreakInterstitialProps) => {
  return (
    <div className="fixed inset-0 z-[90] bg-background/95 flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="flex flex-col items-center gap-4 max-w-sm text-center">
        <div className="relative">
          <Flame className="h-16 w-16 text-destructive animate-pulse" />
          <span className="absolute -top-2 -right-2 text-2xl">⚠️</span>
        </div>

        <h2 className="text-xl font-bold">
          Your {streak}-day streak is about to break!
        </h2>

        <p className="text-muted-foreground">
          Complete any section in the next <strong>{hoursLeft} hour{hoursLeft !== 1 ? "s" : ""}</strong> to save it.
        </p>

        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 w-full">
          <p className="text-sm text-destructive font-medium">
            You'll lose your {getMultiplierLabel(streak)} XP multiplier!
          </p>
        </div>

        <Button onClick={onSaveStreak} size="lg" className="w-full text-base font-semibold">
          🔥 Save My Streak
        </Button>

        <button onClick={onDismiss} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          I'll do it later
        </button>
      </div>
    </div>
  );
};

function getMultiplierLabel(streak: number): string {
  if (streak >= 30) return "3×";
  if (streak >= 14) return "2.5×";
  if (streak >= 7) return "2×";
  if (streak >= 3) return "1.5×";
  return "1×";
}
