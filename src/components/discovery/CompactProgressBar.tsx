import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TierUnlock } from "@/hooks/useFeatureUnlocks";

const tierColors: Record<string, string> = {
  foundation: "bg-blue-500",
  sexual_health: "bg-emerald-500",
  identity: "bg-violet-500",
  relationships: "bg-rose-500",
  advanced: "bg-amber-500",
};

const tierLabels: Record<string, string> = {
  foundation: "Foundation",
  sexual_health: "Sexual",
  identity: "Identity",
  relationships: "Healthy",
  advanced: "Advanced",
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
  const remaining = nextTier ? nextTier.totalModules - nextTier.earnedModules : 0;

  return (
    <button
      onClick={() => navigate("/learn")}
      className="w-full rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:bg-accent/30 active:scale-[0.99]"
    >
      {/* Row 1: Stats + CTA */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-5 flex-1">
          <StatPill value={badgeCount} label="Badges" className="text-primary" />
          <StatPill value={`${completedTiers}/${tiers.length}`} label="Tiers" className="text-muted-foreground" />
          <StatPill value={connectionCount} label="Connects" className="text-emerald-500" />
        </div>
        <span className="flex items-center gap-1.5 bg-primary/15 text-primary rounded-full px-3 py-1.5 text-xs font-semibold shrink-0">
          <BookOpen className="h-3.5 w-3.5" />
          Keep Learning
          <ChevronRight className="h-3 w-3" />
        </span>
      </div>

      {/* Row 2: Next unlock */}
      {nextTier && nextFeature ? (
        <div className="flex items-center gap-2.5 bg-primary/5 border border-primary/15 rounded-lg px-3 py-2 mb-3">
          <span className="text-base leading-none shrink-0">{nextFeature.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              Next: {nextFeature.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {tierLabels[nextTier.tier] || nextTier.label} tier
            </p>
          </div>
          <span className="bg-primary text-primary-foreground rounded-full px-2.5 py-0.5 text-xs font-bold shrink-0">
            {remaining} to go
          </span>
        </div>
      ) : tiers.length > 0 ? (
        <p className="text-xs text-emerald-500 flex items-center gap-1 mb-3">
          <CheckCircle className="h-3.5 w-3.5" /> All features unlocked
        </p>
      ) : null}

      {/* Row 3: Segmented tier progress */}
      <div className="flex gap-1">
        {tiers.map((tier) => {
          const pct = tier.totalModules > 0 ? (tier.earnedModules / tier.totalModules) * 100 : 0;
          return (
            <div key={tier.tier} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", tierColors[tier.tier] || "bg-primary")}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground leading-none">
                {tierLabels[tier.tier] || tier.label.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>
    </button>
  );
};

const StatPill = ({ value, label, className }: { value: string | number; label: string; className?: string }) => (
  <div className="flex flex-col items-center">
    <span className={cn("text-base font-bold leading-none", className)}>{value}</span>
    <span className="text-sm uppercase tracking-wider text-muted-foreground mt-0.5">{label}</span>
  </div>
);
