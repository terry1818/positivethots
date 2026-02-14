import { getXPForNextLevel, getXPForCurrentLevel, getLevelName } from "@/hooks/useLearningStats";
import { Zap } from "lucide-react";

interface XPBarProps {
  totalXP: number;
  level: number;
}

export const XPBar = ({ totalXP, level }: XPBarProps) => {
  const currentLevelXP = getXPForCurrentLevel(level);
  const nextLevelXP = getXPForNextLevel(level);
  const xpInLevel = totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const percent = xpNeeded > 0 ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 100;

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex items-center gap-1 shrink-0">
        <Zap className="h-4 w-4 text-accent" />
        <span className="text-xs font-bold text-accent">{totalXP}</span>
      </div>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent to-primary rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground shrink-0">Lv.{level}</span>
    </div>
  );
};
