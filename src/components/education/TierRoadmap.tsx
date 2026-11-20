import { useState, useEffect, useRef, useMemo } from "react";
import { Lock, CheckCircle, Crown, ChevronDown } from "lucide-react";
import { m } from "motion/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { TierUnlock } from "@/hooks/useFeatureUnlocks";
import { moduleCompletionPercent } from "@/lib/learnSmallFixes";
import { pathOffsets, pathNodeSpacing, windingConnector } from "@/lib/learnHome";
import { duration, easing } from "@/lib/motionTokens";
import { ProgressRing } from "@/components/motion/ProgressRing";
import { Button } from "@/components/ui/button";

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
  currentModuleId?: string;
  currentStarted?: boolean;
}

const tierLabels: Record<string, string> = {
  foundation: "Foundation (Required)", sexual_health: "Sexual Health", identity: "Identity & Diversity",
  relationships: "Healthy Relationships", advanced: "Advanced Topics",
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

export const BadgePathMap = ({ modulesByTier, earnedModuleIds, isModuleUnlocked, isAdvancedPremiumLocked,
  isPremium, moduleProgress, onModuleClick, tierFeatures, currentModuleId, currentStarted = false,
}: BadgePathMapProps) => {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const scrollTargetRef = useRef<HTMLDivElement>(null);
  const tierData = useMemo(() => TIER_ORDER.map(tier => {
    const modules = (modulesByTier[tier] || []).map(module => {
      const earned = earnedModuleIds.has(module.id);
      const unlocked = isModuleUnlocked(module);
      const premiumLocked = isAdvancedPremiumLocked(module);
      const state: NodeState = earned ? "completed" : premiumLocked ? "premium-locked"
        : !unlocked ? "locked" : module.id === currentModuleId ? "current" : "unlocked";
      return { module, state, percent: moduleCompletionPercent(moduleProgress[module.id]?.completed || 0,
        moduleProgress[module.id]?.total || 0, earned) };
    });
    const completed = modules.filter(node => node.state === "completed").length;
    const total = modules.length;
    return { tier, modules, completed, total, complete: total > 0 && completed === total,
      current: modules.some(node => node.state === "current"),
      features: tierFeatures.find(item => item.tier === tier)?.features || [] };
  }), [modulesByTier, earnedModuleIds, isModuleUnlocked, isAdvancedPremiumLocked, moduleProgress, tierFeatures, currentModuleId]);
  const currentTier = tierData.find(tier => tier.current)?.tier;
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(() => new Set(currentTier ? [currentTier] : []));
  useEffect(() => {
    if (currentTier) setExpandedTiers(previous => new Set([...previous, currentTier]));
  }, [currentTier]);
  useEffect(() => {
    const timer = setTimeout(() => scrollTargetRef.current?.scrollIntoView({
      behavior: reducedMotion ? "instant" : "smooth", block: "center",
    }), duration.normal * 1000);
    return () => clearTimeout(timer);
  }, [currentModuleId, reducedMotion]);
  const toggleTier = (tier: string) => setExpandedTiers(previous => {
    const next = new Set(previous);
    if (next.has(tier)) next.delete(tier); else next.add(tier);
    return next;
  });

  return <div className="relative space-y-2" role="list" aria-label="Learning path">
    {tierData.map(td => {
      if (!td.total) return null;
      const expanded = expandedTiers.has(td.tier);
      const connector = windingConnector(td.total);
      const height = 48 + (td.total - 1) * pathNodeSpacing;
      // A segment is complete only when both endpoints have earned badges.
      const completePrefix = td.modules.findIndex(node => node.state !== "completed");
      const completedNodes = completePrefix < 0 ? td.total : completePrefix;
      return <div key={td.tier} role="listitem" className={`learn-tier learn-tier-${td.tier}`}>
        <Button variant="ghost" onClick={() => toggleTier(td.tier)} aria-expanded={expanded}
          data-tour={td.current ? "learn-tier-active" : undefined} data-walkthrough={td.current ? "learn-tier-active" : undefined}
          aria-controls={`tier-content-${td.tier}`} className="h-auto min-h-[44px] w-full whitespace-normal py-2">
          <span className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-base font-bold text-foreground">
            {td.complete && <CheckCircle className="h-4 w-4 text-success" aria-label="Completed" />}
            {tierLabels[td.tier]} <span className="font-normal text-muted-foreground">{td.completed}/{td.total}</span>
            {td.tier === "advanced" && !isPremium && <Crown className="h-4 w-4" aria-label="Premium required" />}
            <ChevronDown className={cn("h-4 w-4", expanded && "rotate-180")} />
          </span>
        </Button>
        {!expanded && !td.complete && <p className="px-4 pb-2 text-center text-sm text-muted-foreground">
          <Lock className="mr-1 inline h-3 w-3" />{td.tier === "advanced" && !isPremium ? "Complete Foundation and get Premium" : td.tier === "foundation" ? "Complete previous badges first" : "Complete Foundation to unlock"}
        </p>}
        <div id={`tier-content-${td.tier}`} className={cn("grid overflow-hidden", !reducedMotion && "transition-[grid-template-rows] duration-300")}
          style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }} aria-hidden={!expanded}
          {...(!expanded ? { inert: "" } as Record<string, string> : {})}>
          <div className="min-h-0 overflow-hidden">
            <div className="relative mx-auto w-[320px] max-w-full pt-10">
              <svg viewBox={`0 0 320 ${height}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-10 w-full" style={{ height }} aria-hidden="true">
                <defs><clipPath id={`completed-${td.tier}`}><rect width="320" height={completedNodes > 1 ? 48 + (completedNodes - 1) * pathNodeSpacing : 0} /></clipPath></defs>
                <path d={connector} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted" />
                <path d={connector} fill="none" stroke="currentColor" strokeWidth="4" className="learn-tier-color" clipPath={`url(#completed-${td.tier})`} />
              </svg>
              {td.modules.map((node, index) => {
                const { module, state, percent } = node;
                const previous = td.modules[index - 1]?.module || modulesByTier.foundation?.find(item => !earnedModuleIds.has(item.id));
                const label = state === "current" ? `${module.title}, in progress, ${percent} percent`
                  : state === "locked" ? `${module.title}, locked, complete ${previous?.title || "Foundation"} first`
                  : state === "premium-locked" ? `${module.title}, Premium required`
                  : `${module.title}, ${state === "completed" ? "completed, 100 percent" : "available"}`;
                const circle = <span className={cn("learn-path-circle inline-flex h-[64px] w-[64px] items-center justify-center rounded-full border-2 text-2xl font-bold",
                  state === "completed" ? "learn-node-completed" : state === "locked" || state === "premium-locked" ? "border-border bg-muted text-foreground" : "learn-node-open bg-card text-foreground")}>
                  {state === "locked" ? <Lock className="h-6 w-6" /> : state === "premium-locked" ? <Crown className="h-6 w-6" /> : badgeIcons[module.slug] || "★"}
                  {state === "completed" && <CheckCircle className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-card text-success" />}
                </span>;
                return <div key={module.id} ref={state === "current" ? scrollTargetRef : undefined}
                  className="relative flex flex-col items-center" style={{ height: pathNodeSpacing, transform: `translateX(${pathOffsets[index % pathOffsets.length]}px)` }}>
                  {state === "current" && <m.span data-current-bubble className="absolute -top-8 z-10 rounded-lg bg-primary px-3 py-1 text-sm font-bold text-primary-foreground"
                    animate={{ y: reducedMotion ? 0 : [0, -4, 0] }} transition={{ duration: 2, repeat: reducedMotion ? 0 : Infinity, ease: easing.smooth }}>
                    {currentStarted ? "Continue" : "Start"}
                  </m.span>}
                  <Button variant="ghost" aria-label={label} title={module.title} tabIndex={expanded ? 0 : -1}
                    className="learn-path-node relative h-[96px] min-h-[72px] w-[96px] rounded-full p-0 hover:bg-transparent"
                    onClick={() => {
                      if (state === "premium-locked") navigate("/premium");
                      else if (state === "locked") toast.info("Complete previous badges first", { duration: 2000 });
                      else onModuleClick(module.slug);
                    }}>
                    {state === "current" ? <ProgressRing size={80} strokeWidth={4} percent={percent}>{circle}</ProgressRing> : circle}
                  </Button>
                  <span className="max-w-[160px] text-center text-sm font-medium leading-tight text-foreground">{module.title}</span>
                  {state === "premium-locked" && <span className="text-xs text-muted-foreground">Premium required</span>}
                </div>;
              })}
            </div>
            {td.features.length > 0 && <div className="space-y-2 px-4 pb-4 text-sm text-muted-foreground">
              {td.features.map(feature => <p key={feature.key} className="flex items-center gap-2">
                {feature.isUnlocked ? <CheckCircle className="h-4 w-4 shrink-0 text-success" /> : <Lock className="h-4 w-4 shrink-0" />}
                <span>{feature.label}</span>
              </p>)}
            </div>}
          </div>
        </div>
      </div>;
    })}
  </div>;
};
