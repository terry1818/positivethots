import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { EducationBadge } from "@/components/EducationBadge";
import { Lock, Check, Play, ChevronRight } from "lucide-react";

interface Module {
  id: string;
  slug: string;
  title: string;
  description: string;
  tier: string;
  order_index: number;
  badge_number?: number;
  prerequisite_badges?: string[];
  estimated_minutes?: number;
}

interface Badge {
  module_id: string;
  quiz_score?: number;
  earned_at?: string;
}

interface EducationPathProps {
  modules: Module[];
  badges: Badge[];
  currentModuleSlug?: string;
  onModuleSelect: (slug: string) => void;
  totalXP: number;
}

const TIER_CONFIG: Record<string, { label: string; emoji: string; accent: string; bgAccent: string }> = {
  foundation: { label: "Foundation", emoji: "🌱", accent: "text-green-400", bgAccent: "from-green-500/20 to-green-600/10" },
  intermediate: { label: "Intermediate", emoji: "📚", accent: "text-blue-400", bgAccent: "from-blue-500/20 to-blue-600/10" },
  advanced: { label: "Advanced Skills", emoji: "🔬", accent: "text-primary", bgAccent: "from-primary/20 to-primary/10" },
  mastery: { label: "Mastery", emoji: "🎓", accent: "text-yellow-400", bgAccent: "from-yellow-500/20 to-yellow-600/10" },
  elective: { label: "Electives", emoji: "✨", accent: "text-pink-400", bgAccent: "from-pink-500/20 to-pink-600/10" },
};

export const EducationPath = ({
  modules,
  badges,
  currentModuleSlug,
  onModuleSelect,
  totalXP,
}: EducationPathProps) => {
  const reducedMotion = useReducedMotion();
  const badgeModuleIds = useMemo(() => new Set(badges.map(b => b.module_id)), [badges]);

  // Group modules by tier
  const tiers = useMemo(() => {
    const grouped: Record<string, Module[]> = {};
    modules.forEach(m => {
      const tier = m.tier || "foundation";
      if (!grouped[tier]) grouped[tier] = [];
      grouped[tier].push(m);
    });
    // Sort each tier by order_index
    Object.values(grouped).forEach(arr => arr.sort((a, b) => a.order_index - b.order_index));
    return grouped;
  }, [modules]);

  const tierOrder = ["foundation", "intermediate", "advanced", "mastery", "elective"];

  // Determine module state
  const getModuleState = (mod: Module): "completed" | "current" | "available" | "locked" => {
    if (badgeModuleIds.has(mod.id)) return "completed";
    if (mod.slug === currentModuleSlug) return "current";

    // Check prerequisites
    if (mod.prerequisite_badges && mod.prerequisite_badges.length > 0) {
      const allPrereqsMet = mod.prerequisite_badges.every(prereqSlug => {
        const prereqModule = modules.find(m => m.slug === prereqSlug);
        return prereqModule ? badgeModuleIds.has(prereqModule.id) : false;
      });
      if (!allPrereqsMet) return "locked";
    }
    return "available";
  };

  const completedCount = badges.length;

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold">Your Learning Journey</h2>
        <div className="flex justify-center gap-6 text-sm">
          <div>
            <span className="text-2xl font-bold text-primary">{completedCount}</span>
            <span className="text-muted-foreground">/{modules.length} badges</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-primary">{totalXP}</span>
            <span className="text-muted-foreground"> XP</span>
          </div>
        </div>
        <div className="mx-auto max-w-xs">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
              style={{ width: `${modules.length > 0 ? (completedCount / modules.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tier sections */}
      {tierOrder.map(tierKey => {
        const tierModules = tiers[tierKey];
        if (!tierModules || tierModules.length === 0) return null;
        const config = TIER_CONFIG[tierKey] || TIER_CONFIG.foundation;
        const tierCompleted = tierModules.filter(m => badgeModuleIds.has(m.id)).length;

        return (
          <div key={tierKey} className="space-y-3">
            {/* Tier header */}
            <div className={cn("rounded-xl p-3 bg-gradient-to-r", config.bgAccent)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.emoji}</span>
                  <span className={cn("font-bold", config.accent)}>{config.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">{tierCompleted}/{tierModules.length}</span>
              </div>
            </div>

            {/* Path nodes */}
            <div className="relative pl-6">
              {/* Vertical line */}
              <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />

              {tierModules.map((mod, idx) => {
                const state = getModuleState(mod);
                const isLast = idx === tierModules.length - 1;

                // Zigzag: alternate margin
                const zigzag = idx % 3 === 1 ? "ml-8" : idx % 3 === 2 ? "ml-4" : "";

                return (
                  <div key={mod.id} className={cn("relative pb-4", zigzag)}>
                    {/* Node dot on the line */}
                    <div className={cn(
                      "absolute -left-6 top-3 w-4 h-4 rounded-full border-2 z-10",
                      state === "completed" && "bg-primary border-primary",
                      state === "current" && cn("bg-primary/30 border-primary", !reducedMotion && "animate-pulse"),
                      state === "available" && "bg-background border-primary/50",
                      state === "locked" && "bg-muted border-muted-foreground/30"
                    )}>
                      {state === "completed" && <Check className="h-2.5 w-2.5 text-primary-foreground absolute top-0 left-0.5" />}
                      {state === "locked" && <Lock className="h-2 w-2 text-muted-foreground absolute top-0.5 left-0.5" />}
                    </div>

                    {/* Module card */}
                    <button
                      onClick={() => state !== "locked" && onModuleSelect(mod.slug)}
                      disabled={state === "locked"}
                      className={cn(
                        "w-full text-left rounded-xl p-3 border-2 transition-all",
                        state === "completed" && "border-primary/30 bg-primary/5 hover:bg-primary/10",
                        state === "current" && "border-primary bg-primary/10 shadow-md shadow-primary/10",
                        state === "available" && "border-border bg-card hover:border-primary/40",
                        state === "locked" && "border-muted/30 bg-muted/5 opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <EducationBadge
                          moduleSlug={mod.slug}
                          title={mod.title}
                          isEarned={state === "completed"}
                          tier={mod.tier || "foundation"}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-semibold text-sm truncate",
                              state === "locked" && "text-muted-foreground"
                            )}>
                              {mod.title}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {state === "completed" ? "✓ Complete" :
                             state === "current" ? "In Progress" :
                             state === "locked" ? "🔒 Locked" :
                             `~${mod.estimated_minutes || 20} min`}
                          </span>
                        </div>
                        {state === "available" && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <Play className="h-3.5 w-3.5 text-primary ml-0.5" />
                          </div>
                        )}
                        {state === "current" && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <ChevronRight className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
