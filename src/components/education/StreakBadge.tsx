import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  streak: number;
  className?: string;
}

export const StreakBadge = ({ streak, className }: StreakBadgeProps) => {
  if (streak <= 0) return null;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Flame className={cn(
        "h-5 w-5",
        streak >= 30 ? "text-primary animate-pulse" :
        streak >= 7 ? "text-accent" :
        "text-muted-foreground"
      )} />
      <span className={cn(
        "text-sm font-bold",
        streak >= 30 ? "text-primary" :
        streak >= 7 ? "text-accent" :
        "text-muted-foreground"
      )}>
        {streak}
      </span>
    </div>
  );
};
