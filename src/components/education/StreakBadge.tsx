import { Flame, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStreakMultiplierLabel } from "@/hooks/useLearningStats";

interface StreakBadgeProps {
  streak: number;
  className?: string;
  showFreeze?: boolean;
  freezeCount?: number;
  freezeAvailable?: boolean;
  atRisk?: boolean;
  hoursLeft?: number;
}

const getFlameConfig = (streak: number) => {
  if (streak >= 100) return { size: "h-7 w-7", color: "text-primary", glow: "animate-streak-glow", label: "🏆 Century" };
  if (streak >= 30) return { size: "h-6 w-6", color: "text-primary", glow: "animate-streak-glow", label: "🔥 Inferno" };
  if (streak >= 14) return { size: "h-5.5 w-5.5", color: "text-primary", glow: "animate-pulse", label: "Blazing" };
  if (streak >= 7) return { size: "h-5 w-5", color: "text-accent", glow: "", label: "On fire" };
  if (streak >= 3) return { size: "h-5 w-5", color: "text-accent", glow: "", label: "" };
  return { size: "h-4 w-4", color: "text-muted-foreground", glow: "", label: "" };
};

export const StreakBadge = ({ streak, className, showFreeze, freezeCount = 0, freezeAvailable, atRisk, hoursLeft }: StreakBadgeProps) => {
  if (streak <= 0 && !atRisk) return null;

  const config = getFlameConfig(streak);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="relative">
        <Flame className={cn(config.size, config.color, config.glow)} />
        {streak >= 30 && (
          <div className="absolute inset-0 rounded-full animate-ripple-complete opacity-20 bg-primary" />
        )}
      </div>
      <span className={cn(
        "text-base font-bold",
        streak >= 100 ? "text-primary" :
        streak >= 30 ? "text-primary" :
        streak >= 7 ? "text-accent" :
        "text-muted-foreground"
      )}>
        {streak}
      </span>
      {showFreeze && freezeCount > 0 && (
        <div className="flex items-center gap-0.5 ml-0.5">
          <Snowflake className="h-3 w-3 text-blue-400" />
          <span className="text-sm text-blue-400 font-medium">{freezeCount}</span>
        </div>
      )}
      {/* Legacy support */}
      {showFreeze && freezeAvailable && !freezeCount && (
        <Snowflake className="h-3 w-3 text-blue-400 ml-0.5 animate-pulse" />
      )}
      {/* Streak multiplier */}
      {getStreakMultiplierLabel(streak) && (
        <span className="text-sm font-bold text-primary ml-0.5">
          {getStreakMultiplierLabel(streak)} XP
        </span>
      )}
      {atRisk && hoursLeft !== undefined && hoursLeft < 8 && (
        <span className="text-sm text-destructive font-medium ml-1 animate-heartbeat">
          {hoursLeft}h left!
        </span>
      )}
    </div>
  );
};
