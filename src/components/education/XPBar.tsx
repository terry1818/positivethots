import { m } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { duration } from "@/lib/motionTokens";
import { getXPForNextLevel, getXPForCurrentLevel, getLevelName, getNextReward } from "@/hooks/useLearningStats";
import { Zap } from "lucide-react";

interface XPBarProps {
  initialXP?: number;
  totalXP: number;
  level: number;
}

export const XPBar = ({ totalXP, level, initialXP }: XPBarProps) => {
  const reduced = useReducedMotion();
  const topLevel = level >= 10;
  const currentLevelXP = getXPForCurrentLevel(level);
  const nextLevelXP = getXPForNextLevel(level);
  const xpInLevel = totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const xpRemaining = xpNeeded - xpInLevel;
  const percent = topLevel ? 100 : xpNeeded > 0 ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 100;
  const nextReward = getNextReward(level);
  const nextLevelName = getLevelName(level + 1);

  const oldPercent = initialXP === undefined ? percent : topLevel ? 100 : Math.max(0, Math.min(100, (initialXP - currentLevelXP) / xpNeeded * 100));
  return (
    <div className="space-y-1 w-full">
      {/* Bar row */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 shrink-0">
          <Zap className="h-3.5 w-3.5 text-accent" />
          <span className="text-base font-bold text-accent">{totalXP} XP</span>
        </div>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <m.div className="h-full w-full origin-left bg-gradient-to-r from-accent to-primary rounded-full"
            initial={reduced ? false : { scaleX: oldPercent / 100 }} animate={{ scaleX: percent / 100 }} transition={{ duration: reduced ? 0 : duration.slow }} />
        </div>
        <span className="text-base text-muted-foreground shrink-0 font-medium">
          {topLevel ? "Lv.10" : `Lv.${level} → ${level + 1}`}
        </span>
      </div>

      {/* Next reward hint row */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-sm text-muted-foreground">
          {topLevel ? "Top level reached" : xpRemaining > 0 ? `${xpRemaining} XP to ${nextLevelName}` : "Level up!"}
        </span>
        {nextReward && (
          <span className="text-sm text-accent font-semibold flex items-center gap-0.5">
            Next reward at Lv.{nextReward.level}: {nextReward.icon} {nextReward.label}
          </span>
        )}
      </div>
    </div>
  );
};
