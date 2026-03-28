import { useState, useEffect, useRef, useCallback } from "react";
import { Lock, CheckCircle, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { TierUnlock } from "@/hooks/useFeatureUnlocks";

interface Module {
  id: string;
  slug: string;
  title: string;
  description: string;
  order_index: number;
  is_required: boolean;
  tier: string | null;
  badge_number: number | null;
  estimated_minutes: number | null;
  prerequisite_badges: string[] | null;
  is_optional: boolean | null;
}

interface BadgePathMapProps {
  modulesByTier: Record<string, Module[]>;
  earnedModuleIds: Set<string>;
  isModuleUnlocked: (module: Module) => boolean;
  isAdvancedPremiumLocked: (module: Module) => boolean;
  isPremium: boolean;
  moduleProgress: Record<string, { completed: number; total: number }>;
  onModuleClick: (slug: string) => void;
  tierFeatures: TierUnlock[];
  isStreakAtRisk: boolean;
  streakHoursLeft: number;
  continueModuleId?: string;
  continueSectionNumber?: number;
  continueProgressPercent?: number;
}

const tierConfig: Record<string, { label: string; color: string; bg: string; border: string; fill: string; gradient: string }> = {
  foundation: { label: "Foundation (Required)", color: "text-primary", bg: "bg-primary/15", border: "border-primary", fill: "bg-primary", gradient: "from-primary to-primary/80" },
  sexual_health: { label: "Sexual Health", color: "text-success", bg: "bg-success/15", border: "border-success", fill: "bg-success", gradient: "from-success to-success/80" },
  identity: { label: "Identity & Diversity", color: "text-[hsl(285_55%_45%)]", bg: "bg-[hsl(285_55%_45%)]/15", border: "border-[hsl(285_55%_45%)]", fill: "bg-[hsl(285_55%_45%)]", gradient: "from-[hsl(285_55%_45%)] to-[hsl(285_55%_45%)]/80" },
  relationships: { label: "Healthy Relationships", color: "text-[hsl(340_65%_55%)]", bg: "bg-[hsl(340_65%_55%)]/15", border: "border-[hsl(340_65%_55%)]", fill: "bg-[hsl(340_65%_55%)]", gradient: "from-[hsl(340_65%_55%)] to-[hsl(340_65%_55%)]/80" },
  advanced: { label: "Advanced Topics", color: "text-accent", bg: "bg-accent/15", border: "border-accent", fill: "bg-accent", gradient: "from-accent to-accent/80" },
};

const badgeIcons: Record<string, string> = {
  "consent-fundamentals": "✓",
  "enm-principles": "♡",
  "boundaries-communication": "⬡",
  "safer-sex": "✚",
  "emotional-responsibility": "☀",
  "understanding-desire": "♥",
  "sexual-wellness-basics": "⊕",
  "pleasure-satisfaction": "✧",
  "common-sexual-concerns": "⚕",
  "sexual-orientation-spectrum": "🌈",
  "gender-identity-expression": "⚧",
  "relationship-orientations": "◇",
  "intersectionality-intimacy": "∞",
  "relationship-skills-foundation": "⚘",
  "navigating-conflict": "⚖",
  "jealousy-insecurity": "♦",
  "maintaining-intimacy": "❋",
  "advanced-enm-practices": "★",
  "kink-bdsm-basics": "⛓",
  "relationship-vision": "◉",
  "trauma-informed-relating": "🫂",
  "digital-consent-boundaries": "📱",
  "decolonizing-relationships": "🌍",
  "mental-health-first-aid": "🧠",
  "reproductive-autonomy": "⚕",
  "addiction-compulsivity": "🔄",
  "neurodivergence-intimacy": "🧩",
  "financial-intimacy": "💰",
  "grief-relationship-transitions": "🕊",
};

const TIER_ORDER = ["foundation", "sexual_health", "identity", "relationships", "advanced"];

type NodeState = "completed" | "current" | "unlocked" | "locked" | "premium-locked";

function getNodeState(
  module: Module,
  earned: boolean,
  unlocked: boolean,
  isFirstUnearned: boolean,
  premiumLocked: boolean
): NodeState {
  if (earned) return "completed";
  if (premiumLocked) return "premium-locked";
  if (unlocked && isFirstUnearned) return "current";
  if (unlocked) return "unlocked";
  return "locked";
}

export const BadgePathMap = ({
  modulesByTier,
  earnedModuleIds,
  isModuleUnlocked,
  isAdvancedPremiumLocked,
  isPremium,
  moduleProgress,
  onModuleClick,
  tierFeatures,
  isStreakAtRisk,
  streakHoursLeft,
  continueModuleId,
  continueSectionNumber,
  continueProgressPercent,
}: BadgePathMapProps) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTier, setActiveTier] = useState<string | null>(null);
  const [showFloating, setShowFloating] = useState(false);

  // Build flat list with tier headers
  const allNodes: Array<
    | { type: "tier-header"; tier: string; config: typeof tierConfig["foundation"]; completed: number; total: number; features: TierUnlock["features"] }
    | { type: "module"; module: Module; tier: string; state: NodeState; icon: string; progress: { completed: number; total: number } | undefined; distanceFromCurrent: number }
  > = [];

  let currentNodeIndex = -1;
  let globalIndex = 0;

  TIER_ORDER.forEach((tier) => {
    const modules = modulesByTier[tier];
    if (!modules || modules.length === 0) return;
    const config = tierConfig[tier];
    const tierCompleted = modules.filter((m) => earnedModuleIds.has(m.id)).length;
    const features = tierFeatures.find((t) => t.tier === tier)?.features || [];

    allNodes.push({
      type: "tier-header",
      tier,
      config,
      completed: tierCompleted,
      total: modules.length,
      features,
    });

    let foundFirstUnearned = false;
    modules.forEach((module) => {
      const earned = earnedModuleIds.has(module.id);
      const unlocked = isModuleUnlocked(module);
      const isFirstUnearned = !earned && unlocked && !foundFirstUnearned;
      if (isFirstUnearned) foundFirstUnearned = true;
      const state = getNodeState(module, earned, unlocked, isFirstUnearned);
      const icon = badgeIcons[module.slug] || "★";
      const progress = moduleProgress[module.id];

      if (state === "current") currentNodeIndex = globalIndex;

      allNodes.push({ type: "module", module, tier, state, icon, progress, distanceFromCurrent: 0 });
      globalIndex++;
    });
  });

  // Calculate distance from current node
  let moduleIdx = 0;
  allNodes.forEach((node) => {
    if (node.type === "module") {
      if (currentNodeIndex >= 0) {
        node.distanceFromCurrent = Math.abs(moduleIdx - currentNodeIndex);
      }
      moduleIdx++;
    }
  });

  // Tier header data for floating indicator
  const tierHeaderData = allNodes.filter(n => n.type === "tier-header") as Array<
    { type: "tier-header"; tier: string; config: typeof tierConfig["foundation"]; completed: number; total: number; features: TierUnlock["features"] }
  >;

  // IntersectionObserver to track active tier
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const headers = container.querySelectorAll<HTMLElement>("[data-tier-header]");
    if (headers.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find which tier headers are above viewport (scrolled past)
        const aboveHeaders: { tier: string; top: number }[] = [];
        headers.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.top < 80) {
            aboveHeaders.push({ tier: el.dataset.tierHeader!, top: rect.top });
          }
        });

        if (aboveHeaders.length === 0) {
          // First tier is still visible — hide floating
          setShowFloating(false);
          setActiveTier(null);
        } else {
          // The most recently scrolled-past header is the active tier
          aboveHeaders.sort((a, b) => b.top - a.top);
          setActiveTier(aboveHeaders[0].tier);
          setShowFloating(true);
        }
      },
      { threshold: [0, 1], rootMargin: "-72px 0px 0px 0px" }
    );

    headers.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [allNodes.length]);

  // Active tier info for floating pill
  const activeInfo = activeTier ? tierHeaderData.find(t => t.tier === activeTier) : null;

  return (
    <div className="relative" ref={containerRef}>
      {/* Floating active-tier indicator */}
      {showFloating && activeInfo && (
        <div className="fixed top-[72px] left-1/2 -translate-x-1/2 z-30 transition-all duration-300 animate-in fade-in slide-in-from-top-2">
          <div
            className={cn(
              "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md bg-background/95 shadow-md",
              activeInfo.config.border,
              activeInfo.config.color
            )}
          >
            <span>{activeInfo.config.label}</span>
            <span className="text-muted-foreground font-normal">
              {activeInfo.completed}/{activeInfo.total}
            </span>
            {activeInfo.completed === activeInfo.total && <CheckCircle className="h-3 w-3 text-success" />}
          </div>
        </div>
      )}

      {/* Central vertical connector line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-muted -translate-x-1/2 z-0" />

      <div className="relative z-10 space-y-0">
        {allNodes.map((node, idx) => {
          if (node.type === "tier-header") {
            const isTierComplete = node.completed === node.total;
            return (
              <div
                key={`tier-${node.tier}`}
                data-tier-header={node.tier}
                className="py-4"
              >
                <div className="flex justify-center">
                  <div
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm bg-background/95 shadow-sm",
                      node.config.border,
                      node.config.color
                    )}
                  >
                    <span>{node.config.label}</span>
                    <span className="text-muted-foreground font-normal">
                      {node.completed}/{node.total}
                    </span>
                    {isTierComplete && <CheckCircle className="h-3 w-3 text-success" />}
                  </div>
                </div>
                {/* Milestone card showing feature unlocks */}
                {node.features.length > 0 && (
                  <div className="flex justify-center px-4 pb-2 pt-2 relative z-10">
                    <div className={cn(
                      "w-full max-w-xs rounded-xl border p-3 text-left transition-all",
                      isTierComplete
                        ? "bg-success/5 border-success/30"
                        : "bg-muted/30 border-border"
                    )}>
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-wider mb-2",
                        isTierComplete ? "text-success" : "text-muted-foreground"
                      )}>
                        {isTierComplete ? "✓ Unlocked" : "🔒 Complete this tier to unlock"}
                      </p>
                      <div className="space-y-1.5">
                        {node.features.map(f => (
                          <div key={f.key} className="flex items-center gap-2">
                            <span className="text-base leading-none">{f.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-xs font-semibold leading-tight",
                                f.isUnlocked ? "text-foreground" : "text-muted-foreground"
                              )}>
                                {f.label}
                              </p>
                              <p className="text-[10px] text-muted-foreground leading-tight">
                                {f.description}
                              </p>
                            </div>
                            {f.isUnlocked
                              ? <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
                              : <Lock className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                            }
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // Module node
          const { module, tier, state, icon, progress, distanceFromCurrent } = node;
          const config = tierConfig[tier];
          const progressPercent =
            progress && progress.total > 0
              ? Math.round((progress.completed / progress.total) * 100)
              : 0;

          const isContinueModule = state === "current" && continueModuleId === module.id;
          const showStreakChip = state === "current" && isStreakAtRisk;

          const lockedOpacity =
            state === "locked"
              ? Math.max(0.15, 0.4 - distanceFromCurrent * 0.05)
              : 1;

          return (
            <div key={module.id} className="flex flex-col items-center py-2">
              {idx > 0 && allNodes[idx - 1]?.type === "module" && (
                <div
                  className={cn(
                    "w-0.5 h-6 -mt-2 mb-2 rounded-full",
                    state === "completed" || (allNodes[idx - 1] as any).state === "completed"
                      ? config.fill
                      : "bg-muted"
                  )}
                />
              )}

              <button
                onClick={() => {
                  if (state === "locked") {
                    toast.info("Complete previous badges first", { duration: 2000 });
                  } else {
                    onModuleClick(module.slug);
                  }
                }}
                className="flex flex-col items-center gap-1.5 group"
                style={{ opacity: lockedOpacity }}
                title={state === "locked" ? "Complete previous badges first" : module.title}
              >
                <div className="relative">
                  <div
                    className={cn(
                      "rounded-full flex items-center justify-center font-bold transition-all border-2",
                      state === "completed" &&
                        `w-12 h-12 bg-gradient-to-br ${config.gradient} ${config.border} text-white shadow-md text-lg`,
                      state === "current" &&
                        `w-14 h-14 bg-background ${config.border} ${config.color} shadow-lg text-xl`,
                      state === "unlocked" &&
                        `w-11 h-11 bg-background ${config.border} ${config.color} text-base`,
                      state === "locked" &&
                        "w-9 h-9 bg-muted border-muted text-muted-foreground text-sm"
                    )}
                  >
                    {state === "locked" ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <span>{icon}</span>
                    )}
                  </div>

                  {state === "completed" && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-success rounded-full p-0.5">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                  )}

                  {state === "current" && (
                    <>
                      <div
                        className={cn(
                          "absolute inset-0 rounded-full border-2 animate-pulse",
                          config.border
                        )}
                        style={{ animationDuration: "2s" }}
                      />
                      <div
                        className={cn(
                          "absolute -inset-1.5 rounded-full border animate-pulse opacity-50",
                          config.border
                        )}
                        style={{ animationDuration: "2.5s" }}
                      />
                    </>
                  )}
                </div>

                <span
                  className={cn(
                    "text-xs leading-tight text-center max-w-[120px] line-clamp-2",
                    state === "completed" && "text-success font-medium",
                    state === "current" && cn(config.color, "font-semibold"),
                    state === "unlocked" && "text-foreground",
                    state === "locked" && "text-muted-foreground"
                  )}
                >
                  {module.title}
                </span>

                {isContinueModule && continueSectionNumber && continueProgressPercent != null && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onModuleClick(module.slug);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-[11px] font-medium hover:bg-indigo-500/25 transition-colors"
                  >
                    ▶ Resume · Section {continueSectionNumber} · {continueProgressPercent}%
                  </button>
                )}

                {showStreakChip && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onModuleClick(module.slug);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-destructive/15 border border-destructive/30 text-destructive text-[11px] font-medium hover:bg-destructive/25 transition-colors"
                  >
                    🔥 {streakHoursLeft}h · Save your streak
                  </button>
                )}

                {state === "current" && (
                  <span className={cn("text-[11px] font-bold uppercase tracking-wider", config.color)}>
                    Start →
                  </span>
                )}

                {state === "unlocked" && progressPercent > 0 && progressPercent < 100 && (
                  <div className="w-12 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", config.fill)}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
