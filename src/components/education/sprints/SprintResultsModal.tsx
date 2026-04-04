import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MascotReaction } from "@/components/mascot/MascotReaction";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { TrendingUp, TrendingDown, Minus, Trophy } from "lucide-react";

interface SprintResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rank: number;
  xpEarned: number;
  lessonsCompleted: number;
  scenariosCompleted: number;
  status: "promoted" | "demoted" | "stayed";
  fromTier: string;
  toTier: string;
}

export const SprintResultsModal = ({
  open,
  onOpenChange,
  rank,
  xpEarned,
  lessonsCompleted,
  scenariosCompleted,
  status,
  fromTier,
  toTier,
}: SprintResultsModalProps) => {
  const reducedMotion = useReducedMotion();

  const config = {
    promoted: {
      mascot: "celebrating" as const,
      icon: <TrendingUp className="h-6 w-6 text-green-400" />,
      title: `Promoted to ${toTier}! 🚀`,
      subtitle: "Your hard work paid off!",
      gradient: "from-green-500/20 to-primary/20",
    },
    demoted: {
      mascot: "empathetic" as const,
      icon: <TrendingDown className="h-6 w-6 text-red-400" />,
      title: `Moving to ${toTier}`,
      subtitle: "You'll start fresh next week. Keep learning!",
      gradient: "from-red-500/10 to-muted",
    },
    stayed: {
      mascot: "proud" as const,
      icon: <Minus className="h-6 w-6 text-muted-foreground" />,
      title: `Staying in ${fromTier}`,
      subtitle: "Great consistency! Push for promotion next week.",
      gradient: "from-primary/10 to-muted",
    },
  };

  const c = config[status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5 text-primary" /> Sprint Results
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center">
            <MascotReaction emotion={c.mascot} size="large" position="inline" animate={!reducedMotion} />
          </div>

          <div className={cn("rounded-xl p-4 text-center bg-gradient-to-br", c.gradient)}>
            <div className="flex justify-center mb-2">{c.icon}</div>
            <h3 className="text-lg font-bold text-foreground">{c.title}</h3>
            <p className="text-sm text-muted-foreground">{c.subtitle}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xl font-bold text-foreground">#{rank}</div>
              <div className="text-xs text-muted-foreground">Final Rank</div>
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">{xpEarned.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">XP Earned</div>
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">{lessonsCompleted + scenariosCompleted}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </div>

          <Button onClick={() => onOpenChange(false)} className="w-full rounded-xl" size="lg">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
