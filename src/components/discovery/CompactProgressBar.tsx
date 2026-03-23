import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight } from "lucide-react";
import type { TierUnlock } from "@/hooks/useFeatureUnlocks";

const tierColors: Record<string, string> = {
  foundation: "bg-blue-500",
  sexual_health: "bg-emerald-500",
  identity: "bg-violet-500",
  relationships: "bg-rose-500",
  advanced: "bg-amber-500",
};

interface CompactProgressBarProps {
  tiers: TierUnlock[];
  badgeCount: number;
  suggestionCount: number;
}

export const CompactProgressBar = ({ tiers, badgeCount, suggestionCount }: CompactProgressBarProps) => {
  const navigate = useNavigate();

  const completedTiers = tiers.filter((t) => t.isComplete).length;
  const totalModules = tiers.reduce((s, t) => s + t.totalModules, 0);
  const earnedModules = tiers.reduce((s, t) => s + t.earnedModules, 0);

  return (
    <button
      onClick={() => navigate("/learn")}
      className="w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent/50 active:scale-[0.99]"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{suggestionCount} matches</span>
          <span>·</span>
          <span>{badgeCount} badges</span>
          <span>·</span>
          <span>{completedTiers}/{tiers.length} tiers</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-primary">
          <BookOpen className="h-3.5 w-3.5" />
          Learn
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Segmented progress bar */}
      <div className="flex h-1.5 gap-0.5 rounded-full overflow-hidden">
        {tiers.map((tier) => {
          const pct = tier.totalModules > 0 ? (tier.earnedModules / tier.totalModules) * 100 : 0;
          return (
            <div key={tier.tier} className="flex-1 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${tierColors[tier.tier] || "bg-primary"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          );
        })}
      </div>
    </button>
  );
};
