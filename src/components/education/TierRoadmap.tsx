import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Lock, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TierUnlock } from "@/hooks/useFeatureUnlocks";

const tierColors: Record<string, { text: string; bg: string; border: string; progress: string }> = {
  foundation: { text: "text-primary", bg: "bg-primary/10", border: "border-primary/30", progress: "bg-primary" },
  sexual_health: { text: "text-success", bg: "bg-success/10", border: "border-success/30", progress: "bg-success" },
  identity: { text: "text-[hsl(285_55%_45%)]", bg: "bg-[hsl(285_55%_45%)]/10", border: "border-[hsl(285_55%_45%)]/30", progress: "bg-[hsl(285_55%_45%)]" },
  relationships: { text: "text-[hsl(340_65%_55%)]", bg: "bg-[hsl(340_65%_55%)]/10", border: "border-[hsl(340_65%_55%)]/30", progress: "bg-[hsl(340_65%_55%)]" },
  advanced: { text: "text-accent", bg: "bg-accent/10", border: "border-accent/30", progress: "bg-accent" },
};

interface TierRoadmapProps {
  tiers: TierUnlock[];
}

export const TierRoadmap = ({ tiers }: TierRoadmapProps) => {
  const completedTiers = tiers.filter((t) => t.isComplete).length;

  return (
    <Card className="animate-fade-in overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Feature Roadmap
          <Badge variant="secondary" className="ml-auto text-xs">
            {completedTiers}/{tiers.length} tiers
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Complete education tiers to unlock new features
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        {tiers.map((tier, idx) => {
          const colors = tierColors[tier.tier] || tierColors.foundation;
          const percent = tier.totalModules > 0 ? (tier.earnedModules / tier.totalModules) * 100 : 0;

          return (
            <div
              key={tier.tier}
              className={cn(
                "rounded-lg border p-3 transition-all animate-stagger-fade",
                colors.border,
                tier.isComplete && "ring-1 ring-success/40"
              )}
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              {/* Tier header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {tier.isComplete ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={cn("text-sm font-semibold", colors.text)}>
                    {tier.label}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {tier.earnedModules}/{tier.totalModules}
                </span>
              </div>

              {/* Progress bar */}
              <div className="relative overflow-hidden rounded-full h-1.5 bg-muted mb-2">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", colors.progress)}
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-1.5">
                {tier.features.map((feature) => (
                  <div
                    key={feature.key}
                    className={cn(
                      "inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-all",
                      feature.isUnlocked
                        ? `${colors.bg} ${colors.border} ${colors.text} font-medium`
                        : "bg-muted/50 border-muted text-muted-foreground"
                    )}
                    title={feature.description}
                  >
                    <span>{feature.icon}</span>
                    <span>{feature.label}</span>
                    {feature.isUnlocked && <CheckCircle className="h-2.5 w-2.5" />}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
