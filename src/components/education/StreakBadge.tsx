import { Flame, Snowflake, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStreakMultiplierLabel } from "@/hooks/useLearningStats";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface StreakBadgeProps {
  streak: number;
  className?: string;
  showFreeze?: boolean;
  freezeCount?: number;
  freezeAvailable?: boolean;
  atRisk?: boolean;
  hoursLeft?: number;
  /** Whether user has completed daily activity today */
  dailyComplete?: boolean;
}

const getFlameConfig = (streak: number) => {
  if (streak >= 100) return { size: "h-7 w-7", color: "text-primary", label: "🏆 Century" };
  if (streak >= 30) return { size: "h-6 w-6", color: "text-primary", label: "🔥 Inferno" };
  if (streak >= 14) return { size: "h-5.5 w-5.5", color: "text-primary", label: "Blazing" };
  if (streak >= 7) return { size: "h-5 w-5", color: "text-accent", label: "On fire" };
  if (streak >= 3) return { size: "h-5 w-5", color: "text-accent", label: "" };
  return { size: "h-4 w-4", color: "text-muted-foreground", label: "" };
};

/** Get time-based urgency animation class */
function getUrgencyAnimation(hour: number, dailyComplete: boolean, reducedMotion: boolean): string {
  if (dailyComplete || reducedMotion) return "";
  if (hour >= 23) return "animate-streak-frantic";
  if (hour >= 22) return "animate-streak-rapid-pulse";
  if (hour >= 20) return "animate-streak-fast-pulse";
  if (hour >= 18) return "animate-streak-gentle-pulse";
  return "";
}

export const StreakBadge = ({
  streak, className, showFreeze, freezeCount = 0, freezeAvailable,
  atRisk, hoursLeft, dailyComplete = false,
}: StreakBadgeProps) => {
  const reducedMotion = useReducedMotion();
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());

  useEffect(() => {
    const interval = setInterval(() => setCurrentHour(new Date().getHours()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (streak <= 0 && !atRisk) return null;

  const config = getFlameConfig(streak);
  const urgencyAnim = getUrgencyAnimation(currentHour, dailyComplete, reducedMotion);
  const showUrgencyBadge = !dailyComplete && currentHour >= 23 && !reducedMotion;
  const isFreezeActive = showFreeze && (freezeCount > 0 || freezeAvailable);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="relative">
        <Flame className={cn(
          config.size,
          isFreezeActive ? "text-blue-400" : config.color,
          !reducedMotion && !dailyComplete && streak >= 30 && "animate-streak-glow",
          urgencyAnim
        )} />

        {/* Daily complete: green check overlay */}
        {dailyComplete && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-success rounded-full p-0.5">
            <Check className="h-2.5 w-2.5 text-success-foreground" />
          </div>
        )}

        {/* Urgency "!" badge */}
        {showUrgencyBadge && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center animate-heartbeat">
            !
          </span>
        )}

        {streak >= 30 && !reducedMotion && (
          <div className="absolute inset-0 rounded-full animate-ripple-complete opacity-20 bg-primary" />
        )}
      </div>
      <span className={cn(
        "text-base font-bold",
        currentHour >= 22 && !dailyComplete ? "text-destructive" :
        streak >= 100 ? "text-primary" :
        streak >= 30 ? "text-primary" :
        streak >= 7 ? "text-accent" :
        "text-muted-foreground"
      )}>
        {streak}
      </span>
      {showFreeze && freezeCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-0.5 ml-0.5 cursor-help">
              <Snowflake className="h-3 w-3 text-blue-400" />
              <span className="text-sm text-blue-400 font-medium">{freezeCount}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>Streak Freeze active — you're protected today</TooltipContent>
        </Tooltip>
      )}
      {showFreeze && freezeAvailable && !freezeCount && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Snowflake className="h-3 w-3 text-blue-400 ml-0.5 animate-pulse cursor-help" />
          </TooltipTrigger>
          <TooltipContent>Streak Freeze active — you're protected today</TooltipContent>
        </Tooltip>
      )}
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
