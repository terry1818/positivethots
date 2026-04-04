import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { MascotReaction } from "@/components/mascot/MascotReaction";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Star, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

interface ScenarioSummaryProps {
  title: string;
  score: number;
  maxScore: number;
  xpReward: number;
  choicesMade: { sceneId: string; choiceIdx: number; isBest: boolean }[];
  scenes: { id: string; choices: { text: string; is_best: boolean; feedback: string }[] }[];
  onContinue?: () => void;
  onBack?: () => void;
}

export const ScenarioSummary = ({
  title,
  score,
  maxScore,
  xpReward,
  choicesMade,
  scenes,
  onContinue,
  onBack,
}: ScenarioSummaryProps) => {
  const reducedMotion = useReducedMotion();
  const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  const tier = useMemo(() => {
    if (percent >= 90) return "epic";
    if (percent >= 70) return "rare";
    if (percent >= 50) return "uncommon";
    return "common";
  }, [percent]);

  const tierConfig = {
    epic: { label: "Masterful understanding!", emoji: "🏆", mascot: "celebrating" as const, gradient: "from-primary via-pink-500 to-amber-500" },
    rare: { label: "Well done!", emoji: "✨", mascot: "proud" as const, gradient: "from-primary to-secondary" },
    uncommon: { label: "Good effort!", emoji: "👍", mascot: "encouraging" as const, gradient: "from-primary to-accent" },
    common: { label: "Keep learning!", emoji: "📚", mascot: "empathetic" as const, gradient: "from-muted to-accent" },
  };

  const config = tierConfig[tier];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-md mx-auto w-full space-y-6">
        {/* Mascot */}
        <div className={cn(!reducedMotion && "animate-bounce-in")}>
          <MascotReaction emotion={config.mascot} size="large" position="inline" animate={!reducedMotion} />
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">{config.emoji} {config.label}</h2>
          <p className="text-muted-foreground">{title}</p>
        </div>

        {/* Score */}
        <div className={cn(
          "rounded-2xl p-6 text-center bg-gradient-to-br text-white w-full",
          config.gradient
        )}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="h-6 w-6 fill-white" />
            <span className="text-3xl font-bold">{score} / {maxScore}</span>
          </div>
          <p className="text-white/80">points earned</p>
          <div className="mt-3 inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-sm font-semibold">
            +{xpReward} XP
          </div>
        </div>

        {/* Choices grid */}
        <div className="w-full space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Choices</h3>
          <div className="grid grid-cols-5 gap-2">
            {choicesMade.map((c, i) => (
              <div
                key={i}
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center mx-auto",
                  c.isBest ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
                )}
              >
                {c.isBest ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="w-full space-y-2 pt-2">
          <Button onClick={onContinue} className="w-full rounded-xl" size="lg">
            Continue
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Module
          </Button>
        </div>
      </div>
    </div>
  );
};
