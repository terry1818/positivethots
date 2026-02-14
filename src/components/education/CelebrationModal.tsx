import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getLevelName } from "@/hooks/useLearningStats";
import { Flame, Zap, Star } from "lucide-react";

interface CelebrationModalProps {
  type: "level_up" | "streak_milestone" | "badge_earned" | null;
  level?: number;
  streak?: number;
  badgeTitle?: string;
  onClose: () => void;
}

const streakMessages: Record<number, string> = {
  3: "You're building a habit! 🔥",
  7: "One whole week! You earned a streak freeze! 🧊",
  14: "Two weeks strong! Unstoppable! 💪",
  30: "30 days! You're a learning machine! 🏆",
  100: "100 DAYS! Absolute legend! 👑",
};

export const CelebrationModal = ({ type, level, streak, badgeTitle, onClose }: CelebrationModalProps) => {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number; color: string }>>([]);

  useEffect(() => {
    if (type) {
      const colors = ["hsl(15 85% 60%)", "hsl(175 60% 40%)", "hsl(25 90% 65%)", "hsl(45 80% 50%)", "hsl(270 50% 55%)"];
      setConfetti(
        Array.from({ length: 30 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          delay: Math.random() * 0.5,
          color: colors[i % colors.length],
        }))
      );
    }
  }, [type]);

  if (!type) return null;

  return (
    <Dialog open={!!type} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-sm text-center overflow-hidden">
        {/* Confetti */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {confetti.map((c) => (
            <div
              key={c.id}
              className="absolute w-2 h-2 rounded-full animate-confetti-fall"
              style={{
                left: `${c.x}%`,
                animationDelay: `${c.delay}s`,
                backgroundColor: c.color,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 py-4">
          {type === "level_up" && (
            <>
              <Star className="h-16 w-16 mx-auto text-accent mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold mb-2">Level Up! 🎉</h2>
              <p className="text-lg text-muted-foreground">
                You're now a <span className="font-bold text-foreground">{getLevelName(level || 1)}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">Level {level}</p>
            </>
          )}
          {type === "streak_milestone" && (
            <>
              <Flame className="h-16 w-16 mx-auto text-primary mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold mb-2">{streak}-Day Streak! 🔥</h2>
              <p className="text-muted-foreground">
                {streakMessages[streak || 0] || `${streak} days of learning! Amazing!`}
              </p>
            </>
          )}
          {type === "badge_earned" && (
            <>
              <Zap className="h-16 w-16 mx-auto text-success mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold mb-2">Badge Earned! 🏅</h2>
              <p className="text-muted-foreground">
                You completed <span className="font-bold text-foreground">{badgeTitle}</span>!
              </p>
            </>
          )}
          <Button onClick={onClose} className="mt-6 w-full">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
