import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, MessageSquare, Shield, BookOpen, User, Sparkles, Plus } from "lucide-react";
import type { NudgeAction } from "@/hooks/useProfileCompletion";

const ICON_MAP: Record<string, any> = {
  Camera, MessageSquare, Shield, BookOpen, User, Sparkles,
};

interface ProfileCompletionMeterProps {
  percentage: number;
  nudges: NudgeAction[];
}

export const ProfileCompletionMeter = ({ percentage, nudges }: ProfileCompletionMeterProps) => {
  const [animatedPct, setAnimatedPct] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  if (percentage >= 100) return null;

  const topNudge = nudges[0];

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 animate-fade-in">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Profile {percentage}% complete</p>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-[600ms] ease-out"
            style={{ width: `${animatedPct}%` }}
          />
        </div>
      </div>

      {/* Top nudge with motivation */}
      {topNudge && (
        <button
          onClick={() => navigate(topNudge.route, { state: { focusSection: topNudge.section } })}
          className="w-full flex items-center gap-2 text-left group"
        >
          <div className="rounded-full bg-primary/10 p-1.5 shrink-0">
            <Plus className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-primary font-medium group-hover:underline">{topNudge.label}</span>
            {topNudge.motivation && (
              <p className="text-sm text-muted-foreground truncate">{topNudge.motivation}</p>
            )}
          </div>
          <span className="text-sm text-primary font-medium shrink-0">{topNudge.weight}</span>
        </button>
      )}

      {/* Remaining nudges */}
      {nudges.length > 1 && (
        <div className="space-y-1.5">
          {nudges.slice(1).map((nudge) => {
            const Icon = ICON_MAP[nudge.icon] || BookOpen;
            return (
              <button
                key={nudge.label}
                onClick={() => navigate(nudge.route, { state: { focusSection: nudge.section } })}
                className="w-full flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-2.5 text-left hover:bg-muted/50 transition-colors group"
              >
                <div className="rounded-full bg-primary/10 p-1.5">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-foreground flex-1">{nudge.label}</span>
                <span className="text-sm text-primary font-medium">{nudge.weight}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
