import { cn } from "@/lib/utils";
import { Target } from "lucide-react";

interface SessionGoalProps {
  sectionsToday: number;
  goal?: number;
}

export const SessionGoal = ({ sectionsToday, goal = 3 }: SessionGoalProps) => {
  const progress = Math.min(sectionsToday, goal);
  const percent = (progress / goal) * 100;
  const isComplete = progress >= goal;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className="relative shrink-0">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
          <circle
            cx="20" cy="20" r="16" fill="none"
            stroke={isComplete ? "hsl(var(--success))" : "hsl(var(--accent))"}
            strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${(percent / 100) * 100.5} 100.5`}
            transform="rotate(-90 20 20)"
            className="transition-all duration-700"
          />
        </svg>
        <Target className={cn(
          "absolute inset-0 m-auto h-4 w-4",
          isComplete ? "text-success" : "text-accent"
        )} />
      </div>
      <div>
        <p className="text-xs font-medium">
          {isComplete ? "🎉 Daily goal hit!" : "Today's Goal"}
        </p>
        <p className="text-xs text-muted-foreground">
          {progress}/{goal} sections completed
        </p>
      </div>
    </div>
  );
};
