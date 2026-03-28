import { cn } from "@/lib/utils";
import { Flame, Snowflake } from "lucide-react";

interface StreakCalendarProps {
  streak: number;
  lastActivityDate: string | null;
  freezeCount?: number;
}

export const StreakCalendar = ({ streak, lastActivityDate, freezeCount = 0 }: StreakCalendarProps) => {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    return {
      label: date.toLocaleDateString("en", { weekday: "narrow" }),
      dateStr: date.toISOString().split("T")[0],
      isToday: i === 6,
    };
  });

  const activeDays = new Set<string>();
  if (lastActivityDate) {
    for (let i = 0; i < Math.min(streak, 7); i++) {
      const d = new Date(lastActivityDate);
      d.setDate(d.getDate() - i);
      activeDays.add(d.toISOString().split("T")[0]);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-1 px-2">
        {days.map((day) => {
          const isActive = activeDays.has(day.dateStr);
          return (
            <div key={day.dateStr} className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">{day.label}</span>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : day.isToday
                  ? "bg-muted border-2 border-primary/40"
                  : "bg-muted/50"
              )}>
                {isActive ? (
                  <Flame className="h-4 w-4" />
                ) : (
                  <div className={cn("w-2 h-2 rounded-full", day.isToday ? "bg-primary/40" : "bg-muted-foreground/20")} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Freeze count display */}
      {freezeCount > 0 && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Snowflake className="h-3.5 w-3.5 text-blue-400" />
          <span>{freezeCount} streak freeze{freezeCount !== 1 ? 's' : ''} available</span>
        </div>
      )}
    </div>
  );
};
