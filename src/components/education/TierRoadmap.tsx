import { Lock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
  moduleProgress: Record<string, { completed: number; total: number }>;
  onModuleClick: (slug: string) => void;
  tierFeatures: TierUnlock[];
}

const tierConfig: Record<string, { label: string; color: string; bg: string; border: string; fill: string }> = {
  foundation: { label: "Foundation (Required)", color: "text-primary", bg: "bg-primary/15", border: "border-primary", fill: "bg-primary" },
  sexual_health: { label: "Sexual Health", color: "text-success", bg: "bg-success/15", border: "border-success", fill: "bg-success" },
  identity: { label: "Identity & Diversity", color: "text-[hsl(285_55%_45%)]", bg: "bg-[hsl(285_55%_45%)]/15", border: "border-[hsl(285_55%_45%)]", fill: "bg-[hsl(285_55%_45%)]" },
  relationships: { label: "Healthy Relationships", color: "text-[hsl(340_65%_55%)]", bg: "bg-[hsl(340_65%_55%)]/15", border: "border-[hsl(340_65%_55%)]", fill: "bg-[hsl(340_65%_55%)]" },
  advanced: { label: "Advanced Topics", color: "text-accent", bg: "bg-accent/15", border: "border-accent", fill: "bg-accent" },
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

type NodeState = "completed" | "current" | "unlocked" | "locked";

function getNodeState(
  module: Module,
  earned: boolean,
  unlocked: boolean,
  isFirstUnearned: boolean
): NodeState {
  if (earned) return "completed";
  if (unlocked && isFirstUnearned) return "current";
  if (unlocked) return "unlocked";
  return "locked";
}

export const BadgePathMap = ({
  modulesByTier,
  earnedModuleIds,
  isModuleUnlocked,
  moduleProgress,
  onModuleClick,
  tierFeatures,
}: BadgePathMapProps) => {
  return (
    <div className="space-y-5">
      {TIER_ORDER.map((tier, tierIdx) => {
        const modules = modulesByTier[tier];
        if (!modules || modules.length === 0) return null;
        const config = tierConfig[tier];
        const tierCompleted = modules.filter((m) => earnedModuleIds.has(m.id)).length;
        const isTierComplete = tierCompleted === modules.length;
        const features = tierFeatures.find((t) => t.tier === tier)?.features || [];

        // Find the first unearned module in this tier for "current" state
        let foundFirstUnearned = false;

        return (
          <div key={tier} className="animate-stagger-fade" style={{ animationDelay: `${tierIdx * 80}ms` }}>
            {/* Tier label row */}
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("text-sm font-semibold", config.color)}>{config.label}</span>
              <span className="text-xs text-muted-foreground">
                {tierCompleted}/{modules.length}
              </span>
              {isTierComplete && <CheckCircle className="h-3.5 w-3.5 text-success" />}
              {features.length > 0 && (
                <div className="flex gap-1 ml-auto">
                  {features.map((f) => (
                    <span
                      key={f.key}
                      className={cn(
                        "inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full border",
                        f.isUnlocked
                          ? "bg-success/10 border-success/30 text-success font-medium"
                          : "bg-muted/50 border-muted text-muted-foreground"
                      )}
                      title={f.description}
                    >
                      <span>{f.icon}</span>
                      {f.isUnlocked && <CheckCircle className="h-2 w-2" />}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Horizontal scrollable badge row */}
            <div className="overflow-x-auto scrollbar-hide -mx-1 px-1 pb-2">
              <div className="flex items-start gap-0 min-w-max">
                {modules.map((module, idx) => {
                  const earned = earnedModuleIds.has(module.id);
                  const unlocked = isModuleUnlocked(module);
                  const isFirstUnearned = !earned && unlocked && !foundFirstUnearned;
                  if (isFirstUnearned) foundFirstUnearned = true;
                  const state = getNodeState(module, earned, unlocked, isFirstUnearned);
                  const icon = badgeIcons[module.slug] || "★";
                  const progress = moduleProgress[module.id];
                  const progressPercent =
                    progress && progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

                  return (
                    <div key={module.id} className="flex items-start">
                      {/* Connector line (before node, skip first) */}
                      {idx > 0 && (
                        <div className="flex items-center h-14 pt-1">
                          <div
                            className={cn(
                              "w-6 h-0.5 rounded-full",
                              earned || earnedModuleIds.has(modules[idx - 1]?.id)
                                ? config.fill
                                : "bg-muted"
                            )}
                          />
                        </div>
                      )}

                      {/* Node */}
                      <button
                        onClick={() => {
                          if (state === "locked") {
                            toast.info("Complete previous badges first", { duration: 2000 });
                          } else {
                            onModuleClick(module.slug);
                          }
                        }}
                        className="flex flex-col items-center gap-1 min-w-[64px] group"
                        title={state === "locked" ? "Complete previous badges first" : module.title}
                      >
                        <div className="relative">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all border-2",
                              state === "completed" &&
                                `${config.fill} ${config.border} text-white shadow-md animate-scale-in`,
                              state === "current" &&
                                `bg-background ${config.border} ${config.color} shadow-lg ring-2 ring-offset-2 ring-offset-background`,
                              state === "unlocked" &&
                                `bg-background ${config.border} ${config.color}`,
                              state === "locked" &&
                                "bg-muted border-muted text-muted-foreground opacity-40"
                            )}
                          >
                            {state === "locked" ? (
                              <Lock className="h-4 w-4" />
                            ) : (
                              <span>{icon}</span>
                            )}
                          </div>

                          {/* Completed checkmark overlay */}
                          {state === "completed" && (
                            <div className="absolute -bottom-0.5 -right-0.5 bg-success rounded-full p-0.5">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                          )}

                          {/* Current pulsing ring */}
                          {state === "current" && (
                            <div
                              className={cn(
                                "absolute inset-0 rounded-full border-2 animate-pulse",
                                config.border
                              )}
                              style={{ animationDuration: "2s" }}
                            />
                          )}
                        </div>

                        {/* Label */}
                        <span
                          className={cn(
                            "text-[10px] leading-tight text-center max-w-[64px] line-clamp-2",
                            state === "completed" && "text-success font-medium",
                            state === "current" && cn(config.color, "font-semibold"),
                            state === "unlocked" && "text-foreground",
                            state === "locked" && "text-muted-foreground opacity-40"
                          )}
                        >
                          {module.title}
                        </span>

                        {/* Current: START label */}
                        {state === "current" && (
                          <span className={cn("text-[9px] font-bold uppercase tracking-wider", config.color)}>
                            Start →
                          </span>
                        )}

                        {/* Unlocked in-progress: mini progress bar */}
                        {state === "unlocked" && progressPercent > 0 && progressPercent < 100 && (
                          <div className="w-10 h-1 rounded-full bg-muted overflow-hidden">
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
          </div>
        );
      })}
    </div>
  );
};
