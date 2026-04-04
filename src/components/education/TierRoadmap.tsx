import { useState, useEffect, useRef, useMemo } from "react";
import { Lock, CheckCircle, Crown, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useReducedMotion } from "@/hooks/useReducedMotion";
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

export interface BadgePathMapProps {
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
  "consent-fundamentals": "✓", "enm-principles": "♡", "boundaries-communication": "⬡",
  "safer-sex": "✚", "emotional-responsibility": "☀", "understanding-desire": "♥",
  "sexual-wellness-basics": "⊕", "pleasure-satisfaction": "✧", "common-sexual-concerns": "⚕",
  "sexual-orientation-spectrum": "🌈", "gender-identity-expression": "⚧", "relationship-orientations": "◇",
  "intersectionality-intimacy": "∞", "relationship-skills-foundation": "⚘", "navigating-conflict": "⚖",
  "jealousy-insecurity": "♦", "maintaining-intimacy": "❋", "advanced-enm-practices": "★",
  "kink-bdsm-basics": "⛓", "relationship-vision": "◉", "trauma-informed-relating": "🫂",
  "digital-consent-boundaries": "📱", "decolonizing-relationships": "🌍", "mental-health-first-aid": "🧠",
  "reproductive-autonomy": "⚕", "addiction-compulsivity": "🔄", "neurodivergence-intimacy": "🧩",
  "financial-intimacy": "💰", "grief-relationship-transitions": "🕊",
};

const TIER_ORDER = ["foundation", "sexual_health", "identity", "relationships", "advanced"];

type NodeState = "completed" | "current" | "unlocked" | "locked" | "premium-locked";

function getNodeState(
  module: Module, earned: boolean, unlocked: boolean, isFirstUnearned: boolean, premiumLocked: boolean
): NodeState {
  if (earned) return "completed";
  if (premiumLocked) return "premium-locked";
  if (unlocked && isFirstUnearned) return "current";
  if (unlocked) return "unlocked";
  return "locked";
}

type TierStatus = "completed" | "in-progress" | "locked";

export const BadgePathMap = ({
  modulesByTier, earnedModuleIds, isModuleUnlocked, isAdvancedPremiumLocked,
  isPremium, moduleProgress, onModuleClick, tierFeatures,
  isStreakAtRisk, streakHoursLeft, continueModuleId, continueSectionNumber, continueProgressPercent,
}: BadgePathMapProps) => {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const scrollTargetRef = useRef<HTMLDivElement>(null);

  // Build tier data
  const tierData = useMemo(() => {
    return TIER_ORDER.map((tier) => {
      const modules = modulesByTier[tier] || [];
      const config = tierConfig[tier];
      const features = tierFeatures.find((t) => t.tier === tier)?.features || [];
      const completed = modules.filter((m) => earnedModuleIds.has(m.id)).length;
      const total = modules.length;

      let foundFirstUnearned = false;
      const moduleNodes = modules.map((module) => {
        const earned = earnedModuleIds.has(module.id);
        const unlocked = isModuleUnlocked(module);
        const premiumLocked = isAdvancedPremiumLocked(module);
        const isFirstUnearned = !earned && unlocked && !foundFirstUnearned;
        if (isFirstUnearned) foundFirstUnearned = true;
        const state = getNodeState(module, earned, unlocked, isFirstUnearned, premiumLocked);
        const icon = badgeIcons[module.slug] || "★";
        const progress = moduleProgress[module.id];
        return { module, state, icon, progress };
      });

      const isTierComplete = total > 0 && completed === total;
      const hasAnyUnlocked = moduleNodes.some(n => n.state !== "locked" && n.state !== "premium-locked");
      const isInProgress = !isTierComplete && hasAnyUnlocked && completed > 0;
      const hasCurrent = moduleNodes.some(n => n.state === "current");

      let status: TierStatus = "locked";
      if (isTierComplete) status = "completed";
      else if (hasCurrent || isInProgress || (hasAnyUnlocked && completed === 0 && modules.length > 0 && moduleNodes.some(n => n.state === "current" || n.state === "unlocked"))) status = "in-progress";

      // Check if the continue module is in this tier
      const hasContinue = moduleNodes.some(n => n.module.id === continueModuleId && n.state === "current");
      const hasStreakRisk = moduleNodes.some(n => n.state === "current") && isStreakAtRisk;

      return { tier, config, modules: moduleNodes, completed, total, features, status, isTierComplete, hasContinue, hasStreakRisk };
    });
  }, [modulesByTier, earnedModuleIds, isModuleUnlocked, isAdvancedPremiumLocked, moduleProgress, tierFeatures, continueModuleId, isStreakAtRisk]);

  // Determine which tiers start expanded
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(() => {
    const expanded = new Set<string>();
    let foundInProgress = false;
    for (const td of tierData) {
      if (td.status === "in-progress" && !foundInProgress) {
        expanded.add(td.tier);
        foundInProgress = true;
      }
    }
    // If nothing is in progress, expand the first non-completed tier
    if (!foundInProgress) {
      const first = tierData.find(td => td.status !== "completed");
      if (first) expanded.add(first.tier);
    }
    return expanded;
  });

  const toggleTier = (tier: string) => {
    setExpandedTiers(prev => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  };

  // Auto-scroll to current progress on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollTargetRef.current?.scrollIntoView({
        behavior: reducedMotion ? "instant" : "smooth",
        block: "start",
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  // Find the tier to attach scroll ref to
  const scrollTargetTier = tierData.find(td => td.status === "in-progress")?.tier
    || tierData.find(td => td.status !== "completed")?.tier;

  return (
    <div className="relative space-y-2">
      {tierData.map((td) => {
        if (td.modules.length === 0) return null;
        const isExpanded = expandedTiers.has(td.tier);
        const isScrollTarget = td.tier === scrollTargetTier;

        // Compact feature summary for collapsed state
        const featureSummary = td.features.length > 0 ? (
          td.isTierComplete
            ? `✓ Unlocked: ${td.features.map(f => f.label).join(", ")}`
            : `🔒 ${td.total - td.completed} badge${td.total - td.completed !== 1 ? "s" : ""} to unlock ${td.features[0]?.label || ""}`
        ) : null;

        // Continue / streak pills that stay visible even when collapsed
        const continueNode = td.hasContinue && continueSectionNumber && continueProgressPercent != null;
        const streakNode = td.hasStreakRisk;

        return (
          <div key={td.tier} ref={isScrollTarget ? scrollTargetRef : undefined} className="scroll-mt-20">
            {/* Tier header — always visible */}
            <button
              onClick={() => toggleTier(td.tier)}
              className="w-full flex items-center justify-center py-3"
              aria-expanded={isExpanded}
              aria-controls={`tier-content-${td.tier}`}
            >
              <div
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-bold border backdrop-blur-sm bg-background/95 shadow-sm transition-colors",
                  td.config.border, td.config.color
                )}
              >
                <span>{td.config.label}</span>
                {td.tier === "advanced" && !isPremium && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 text-sm font-bold">
                    <Crown className="h-3 w-3" /> Premium
                  </span>
                )}
                <span className="text-muted-foreground font-normal text-base">
                  {td.completed}/{td.total}
                </span>
                {td.isTierComplete && <CheckCircle className="h-4 w-4 text-success" />}
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isExpanded && "rotate-180",
                  reducedMotion && "transition-none"
                )} />
              </div>
            </button>

            {/* Collapsed: show feature summary + action pills */}
            {!isExpanded && (
              <div className="flex flex-col items-center gap-1.5 pb-2">
                {featureSummary && (
                  <p className="text-sm text-muted-foreground text-center px-4 max-w-xs">{featureSummary}</p>
                )}
                {continueNode && (
                  <button
                    onClick={() => onModuleClick(td.modules.find(n => n.module.id === continueModuleId)?.module.slug || "")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-base font-semibold hover:bg-indigo-500/25 transition-colors"
                  >
                    ▶ Resume · Section {continueSectionNumber} · {continueProgressPercent}%
                  </button>
                )}
                {streakNode && (
                  <button
                    onClick={() => {
                      const currentMod = td.modules.find(n => n.state === "current");
                      if (currentMod) onModuleClick(currentMod.module.slug);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-destructive/15 border border-destructive/30 text-destructive text-base font-semibold hover:bg-destructive/25 transition-colors"
                  >
                    🔥 {streakHoursLeft}h · Save your streak
                  </button>
                )}
              </div>
            )}

            {/* Collapsible content */}
            <div
              id={`tier-content-${td.tier}`}
              className={cn(
                "overflow-hidden",
                reducedMotion ? "" : "transition-all duration-200 ease-in-out",
                isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
              )}
            >
              {/* Feature unlock card */}
              {td.features.length > 0 && (
                <div className="flex justify-center px-4 pb-2 pt-1">
                  <div className={cn(
                    "w-full max-w-xs rounded-xl border p-3 text-left",
                    td.isTierComplete ? "bg-success/5 border-success/30" : "bg-muted/30 border-border"
                  )}>
                    <p className={cn(
                      "text-base font-bold uppercase tracking-wider mb-2",
                      td.isTierComplete ? "text-success" : "text-muted-foreground"
                    )}>
                      {td.isTierComplete ? "✓ Unlocked" : "🔒 Complete this tier to unlock"}
                    </p>
                    <div className="space-y-1.5">
                      {td.features.map(f => (
                        <div key={f.key} className="flex items-center gap-2">
                          <span className="text-base leading-none">{f.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-lg font-medium leading-tight",
                              f.isUnlocked ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {f.label}
                            </p>
                            <p className="text-base text-muted-foreground leading-tight">
                              {f.description}
                            </p>
                          </div>
                          {f.isUnlocked
                            ? <CheckCircle className="h-4 w-4 text-success shrink-0" />
                            : <Lock className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Module nodes with central line */}
              <div className="relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-muted -translate-x-1/2 z-0" />
                <div className="relative z-10">
                  {td.modules.map((node, idx) => {
                    const { module, state, icon, progress } = node;
                    const config = td.config;
                    const progressPercent = progress && progress.total > 0
                      ? Math.round((progress.completed / progress.total) * 100) : 0;

                    const isContinueModule = state === "current" && continueModuleId === module.id;
                    const showStreakChip = state === "current" && isStreakAtRisk;

                    return (
                      <div key={module.id} className="flex flex-col items-center py-2">
                        {idx > 0 && (
                          <div className={cn(
                            "w-0.5 h-6 -mt-2 mb-2 rounded-full",
                            state === "completed" || td.modules[idx - 1]?.state === "completed"
                              ? config.fill : "bg-muted"
                          )} />
                        )}

                        <button
                          onClick={() => {
                            if (state === "premium-locked") navigate("/premium");
                            else if (state === "locked") toast.info("Complete previous badges first", { duration: 2000 });
                            else onModuleClick(module.slug);
                          }}
                          className="flex flex-col items-center gap-1.5 group"
                          style={{ opacity: state === "locked" ? 0.3 : state === "premium-locked" ? 0.6 : 1 }}
                          title={state === "premium-locked" ? "Premium Required" : state === "locked" ? "Complete previous badges first" : module.title}
                        >
                          <div className="relative">
                            <div className={cn(
                              "rounded-full flex items-center justify-center font-bold transition-all border-2",
                              state === "completed" && `w-12 h-12 bg-gradient-to-br ${config.gradient} ${config.border} text-white shadow-md text-lg`,
                              state === "current" && `w-14 h-14 bg-background ${config.border} ${config.color} shadow-lg text-xl`,
                              state === "unlocked" && `w-11 h-11 bg-background ${config.border} ${config.color} text-base`,
                              state === "premium-locked" && "w-10 h-10 bg-amber-500/10 border-amber-500/40 text-amber-500 text-sm",
                              state === "locked" && "w-9 h-9 bg-muted border-muted text-muted-foreground text-sm"
                            )}>
                              {state === "locked" ? <Lock className="h-3.5 w-3.5" /> :
                               state === "premium-locked" ? <Crown className="h-4 w-4" /> :
                               <span>{icon}</span>}
                            </div>
                            {state === "completed" && (
                              <div className="absolute -bottom-0.5 -right-0.5 bg-success rounded-full p-0.5">
                                <CheckCircle className="h-3 w-3 text-white" />
                              </div>
                            )}
                            {state === "current" && (
                              <>
                                <div className={cn("absolute inset-0 rounded-full border-2 animate-pulse", config.border)} style={{ animationDuration: "2s" }} />
                                <div className={cn("absolute -inset-1.5 rounded-full border animate-pulse opacity-50", config.border)} style={{ animationDuration: "2.5s" }} />
                              </>
                            )}
                          </div>

                          <span className={cn(
                            "text-base font-medium leading-tight text-center max-w-[140px] line-clamp-2",
                            state === "completed" && "text-success",
                            state === "current" && cn(config.color, "font-semibold"),
                            state === "unlocked" && "text-foreground",
                            state === "premium-locked" && "text-amber-500",
                            state === "locked" && "text-muted-foreground"
                          )}>
                            {module.title}
                          </span>

                          {state === "premium-locked" && (
                            <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-amber-500">
                              <Crown className="h-3 w-3" /> Premium Required
                            </span>
                          )}

                          {isContinueModule && continueSectionNumber && continueProgressPercent != null && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onModuleClick(module.slug); }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-base font-semibold hover:bg-indigo-500/25 transition-colors"
                            >
                              ▶ Resume · Section {continueSectionNumber} · {continueProgressPercent}%
                            </button>
                          )}

                          {showStreakChip && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onModuleClick(module.slug); }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-destructive/15 border border-destructive/30 text-destructive text-base font-semibold hover:bg-destructive/25 transition-colors"
                            >
                              🔥 {streakHoursLeft}h · Save your streak
                            </button>
                          )}

                          {state === "current" && !isContinueModule && (
                            <span className={cn("text-sm font-bold uppercase tracking-wider", config.color)}>
                              Start →
                            </span>
                          )}

                          {state === "unlocked" && progressPercent > 0 && progressPercent < 100 && (
                            <div className="w-12 h-1 rounded-full bg-muted overflow-hidden">
                              <div className={cn("h-full rounded-full", config.fill)} style={{ width: `${progressPercent}%` }} />
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
