import { useNavigate } from "react-router-dom";
import { BookOpen, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
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
  connectionCount: number;
}

export const CompactProgressBar = ({ tiers, badgeCount, connectionCount }: CompactProgressBarProps) => {
  const navigate = useNavigate();

  const completedTiers = tiers.filter((t) => t.isComplete).length;

  const nextTier = tiers.find((t) => !t.isComplete);
  const nextFeature = nextTier?.features.find((f) => !f.isUnlocked);

  return (
    <button
      onClick={() => navigate("/learn")}
      className="w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent/50 active:scale-[0.99]"
    >
      {/* Section 1 — Stats row + CTA */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          {[
            { value: badgeCount, label: "Badges", color: "text-primary" },
            { value: `${completedTiers}/${tiers.length}`, label: "Tiers", color: "text-muted-foreground" },
            { value: connectionCount, label: "Connections", color: "text-emerald-500" },
          ].map(({ value, label, color }) => (
            <div key={label} className="flex flex-col items-center">
              <span className={cn("text-lg font-bold leading-none", color)}>{value}</span>
              <span className="text-[9px] uppercase tracking-wide text-muted-foreground mt-0.5">{label}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span
            className="flex items-center gap-1.5 bg-primary/20 text-primary rounded-full px-3 py-1.5 text-xs font-semibold"
          >
            <BookOpen className="h-3 w-3" />
            Keep Learning
          </span>
          <span className="text-[9px] text-muted-foreground">tap to unlock more</span>
        </div>
      </div>

      {/* Section 2 — Next unlock card */}
      {nextTier && nextFeature ? (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 mb-3">
          <span className="text-base leading-none flex-shrink-0">{nextFeature.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              Next unlock: {nextFeature.label}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {nextTier.label} tier · {nextTier.totalModules - nextTier.earnedModules} badge{nextTier.totalModules - nextTier.earnedModules !== 1 ? "s" : ""} needed
            </p>
          </div>
          <div className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] font-bold flex-shrink-0">
            {nextTier.totalModules - nextTier.earnedModules} to go
          </div>
        </div>
      ) : tiers.length > 0 ? (
        <p className="text-xs text-emerald-500 flex items-center gap-1 mb-3">
          <CheckCircle className="h-3.5 w-3.5" /> All features unlocked
        </p>
      ) : null}

      {/* Section 3 — Segmented progress bar with tier labels */}
      <div>
        <div className="flex mb-1">
          {tiers.map((tier) => (
            <div key={tier.tier} className="flex-1 text-[8px] text-muted-foreground truncate px-0.5">
              {tier.label.split(" ")[0]}
            </div>
          ))}
        </div>
        <div className="flex h-2 gap-1 rounded-full overflow-hidden">
          {tiers.map((tier) => {
            const pct = tier.totalModules > 0 ? (tier.earnedModules / tier.totalModules) * 100 : 0;
            return (
              <div key={tier.tier} className="flex-1 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", tierColors[tier.tier] || "bg-primary")}
                  style={{ width: `${pct}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </button>
  );
};
