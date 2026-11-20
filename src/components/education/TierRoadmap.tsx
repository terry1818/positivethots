import { useState, useEffect, useRef, useMemo } from "react";
import { Lock, CheckCircle, Crown, ChevronDown, BookOpen, Trophy } from "lucide-react";
import { m } from "motion/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { TierUnlock } from "@/hooks/useFeatureUnlocks";
import { levelNodes, type LessonSection } from "@/lib/learnLevels";
import { useSessionStore } from "@/stores/sessionStore";
import { ModuleGuide } from "./ModuleGuide";
import { moduleCompletionPercent } from "@/lib/learnSmallFixes";
import { pathOffsets, pathNodeSpacing, windingConnector } from "@/lib/learnHome";
import { completedNodeId } from "@/lib/learnFinish";
import { duration, easing, spring } from "@/lib/motionTokens";
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
  sections: LessonSection[];
  completedSectionIds: Set<string>;
  startedSectionIds: Set<string>;
  onModuleClick: (slug: string) => void;
  tierFeatures: TierUnlock[];
  currentModuleId?: string;
  currentStarted?: boolean;
  justCompleted?: { moduleId: string; node: string };
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

export const BadgePathMap = ({ modulesByTier, earnedModuleIds, isModuleUnlocked, isAdvancedPremiumLocked,
  isPremium, moduleProgress, onModuleClick, tierFeatures, currentModuleId, currentStarted = false,
  sections, completedSectionIds, startedSectionIds, justCompleted,
}: BadgePathMapProps) => {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const targetRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(220);
  const finishedNode = justCompleted ? completedNodeId(justCompleted, sections) : undefined;
  const [finishPhase, setFinishPhase] = useState(reduced || !justCompleted ? 3 : 0);
  const returnNode = useSessionStore.getState().getSessionData<string | null>("learn-return-node", null);
  const returnModule = sections.find(s => s.id === returnNode)?.module_id || (returnNode?.startsWith("quiz:") ? returnNode.slice(5) : undefined);
  const currentTier = TIER_ORDER.find(tier => modulesByTier[tier]?.some(m => m.id === (justCompleted?.moduleId || returnModule || currentModuleId)));
  const nextTier = TIER_ORDER.find(tier => modulesByTier[tier]?.some(m => m.id === currentModuleId));
  const [expandedTiers, setExpandedTiers] = useState(() => new Set(currentTier ? [currentTier] : []));
  const [expandedLevels, setExpandedLevels] = useState(() => new Set([currentModuleId, justCompleted?.moduleId || returnModule].filter((id): id is string => Boolean(id))));
  useEffect(() => {
    if (!justCompleted || reduced) return;
    const timers = [setTimeout(() => setFinishPhase(1), 100), setTimeout(() => setFinishPhase(2), 500), setTimeout(() => {
      setFinishPhase(3);
      if (justCompleted.node === "badge") setExpandedLevels(previous => { const next = new Set(previous); next.delete(justCompleted.moduleId); if (currentModuleId) next.add(currentModuleId); return next; });
      if (justCompleted.node === "badge") requestAnimationFrame(() => {
        targetRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
    }, 1200)];
    return () => timers.forEach(clearTimeout);
  }, [justCompleted, reduced, currentModuleId]);
  useEffect(() => {
    if (justCompleted?.node === "badge" && reduced) {
      setExpandedLevels(previous => { const next = new Set(previous); next.delete(justCompleted.moduleId); return next; });
      const timer = setTimeout(() => targetRef.current?.scrollIntoView({ block: "center", behavior: "instant" }), 1200);
      return () => clearTimeout(timer);
    }
  }, [justCompleted, reduced, currentModuleId]);
  const [guideId, setGuideId] = useState<string | null>(null);
  const allModules = TIER_ORDER.flatMap(tier => modulesByTier[tier] || []);
  const guide = allModules.find(m => m.id === guideId);
  useEffect(() => {
    const header = document.querySelector("header.sticky");
    if (!header) return;
    const observer = new ResizeObserver(() => setHeaderHeight(header.getBoundingClientRect().height));
    observer.observe(header); setHeaderHeight(header.getBoundingClientRect().height);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (currentTier) setExpandedTiers(previous => new Set([...previous, currentTier, ...(nextTier ? [nextTier] : [])]));
    if (currentModuleId) setExpandedLevels(previous => new Set([...previous, currentModuleId]));
  }, [currentTier, currentModuleId, nextTier]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const completed = !reduced && finishedNode ? document.getElementById(`learn-node-${finishedNode}`) : null;
      const returned = returnNode ? document.getElementById(`learn-node-${returnNode}`) : null;
      const target = completed || returned || targetRef.current;
      if (target) {
        const navHeight = document.querySelector('[aria-label="Main navigation"]')?.getBoundingClientRect().height || 88;
        const visibleTop = headerHeight + 104;
        const visibleBottom = window.innerHeight - navHeight - 64;
        const nodeTop = visibleTop + Math.max(0, (visibleBottom - visibleTop - 96) / 2);
        window.scrollTo({ top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - nodeTop), behavior: reduced ? "instant" : "smooth" });
      }
    }, duration.normal * 1000);
    return () => clearTimeout(timer);
  }, [currentModuleId, reduced, returnNode, headerHeight, finishedNode]);
  const toggle = (id: string, tier = false) => {
    const anchor = targetRef.current;
    const before = anchor?.getBoundingClientRect().top;
    const setter = tier ? setExpandedTiers : setExpandedLevels;
    setter(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; });
    if (before !== undefined) requestAnimationFrame(() => {
      const after = anchor?.getBoundingClientRect().top;
      if (after !== undefined) window.scrollBy({ top: after - before, behavior: "instant" });
    });
  };
  const moduleSections = (id: string) => sections.filter(s => s.module_id === id).sort((a,b) => a.section_number - b.section_number);
  const go = (module: Module, section?: number) => onModuleClick(`${module.slug}${section ? `?section=${section}` : "?quiz=1"}`);
  const reason = (module: Module) => {
    if (earnedModuleIds.has(module.id)) return undefined;
    if (isAdvancedPremiumLocked(module)) return "Complete Foundation and get Premium to unlock this level.";
    if (isModuleUnlocked(module)) return undefined;
    const tierModules = modulesByTier[module.tier || "foundation"] || [];
    const previous = tierModules[tierModules.findIndex(m => m.id === module.id) - 1];
    return `Complete ${previous?.title || "Foundation"} first`;
  };
  const startModule = (module: Module) => {
    const lesson = moduleSections(module.id).find(s => !completedSectionIds.has(s.id));
    if (earnedModuleIds.has(module.id)) go(module, moduleSections(module.id)[0]?.section_number || 1);
    else go(module, lesson?.section_number);
  };
  return <div role="list" aria-label="Learning path" className="space-y-4" style={{ "--learn-header-height": `${headerHeight}px` } as React.CSSProperties}>
    {TIER_ORDER.map(tier => {
      const modules = modulesByTier[tier] || [];
      if (!modules.length) return null;
      const earned = modules.filter(m => earnedModuleIds.has(m.id)).length;
      const features = tierFeatures.find(t => t.tier === tier)?.features || [];
      const tierOpen = expandedTiers.has(tier);
      return <div key={tier} role="listitem" className={`learn-tier learn-tier-${tier}`}>
        <Button variant="ghost" className="min-h-[44px] h-auto w-full whitespace-normal" onClick={() => toggle(tier, true)}
          aria-expanded={tierOpen} data-tour={tier === currentTier ? "learn-tier-active" : undefined} data-walkthrough={tier === currentTier ? "learn-tier-active" : undefined}>
          {earned === modules.length && <CheckCircle className="h-4 w-4" />}{tierLabels[tier]} · {earned}/{modules.length}<ChevronDown className={cn("h-4 w-4", tierOpen && "rotate-180")} />
        </Button>
        {!tierOpen && earned < modules.length && <p className="text-center text-sm text-muted-foreground">{tier === "advanced" && !isPremium ? "Complete Foundation and get Premium" : "Complete Foundation to unlock"}</p>}
        {tierOpen && <div className="space-y-4">
          {modules.map((module, levelIndex) => {
            const earnedBadge = earnedModuleIds.has(module.id);
            const unlocked = earnedBadge || isModuleUnlocked(module);
            const premium = isAdvancedPremiumLocked(module);
            const expanded = expandedLevels.has(module.id);
            const lessons = moduleSections(module.id);
            const nodes = levelNodes(lessons, completedSectionIds, earnedBadge, unlocked);
            const done = nodes.filter(n => n.done).length;
            const connector = windingConnector(nodes.length);
            const height = 48 + (nodes.length - 1) * pathNodeSpacing;
            const firstIncomplete = nodes.findIndex(n => !n.done);
            const donePrefix = firstIncomplete < 0 ? nodes.length : firstIncomplete;
            return <section key={module.id} aria-label={module.title} className="learn-level-block">
              {expanded ? <header className="learn-level-band sticky z-20 flex items-center gap-2 px-3 py-2" style={{ top: headerHeight }}>
                <div className="min-w-0 flex-1"><p className="text-xs">{tierLabels[tier]} · Level {levelIndex + 1} of {modules.length}</p><h3 className="text-base font-bold leading-tight">{module.title}</h3></div>
                <span className="shrink-0 text-sm">{done}/{nodes.length}</span>
                <Button variant="outline" className="min-h-[44px] bg-card text-foreground" onClick={() => setGuideId(module.id)}>Guide</Button>
                {module.id !== currentModuleId && <Button variant="ghost" size="icon" aria-label={`Collapse ${module.title}`} onClick={() => toggle(module.id)}><ChevronDown /></Button>}
              </header> : <div className="flex min-h-[72px] items-center gap-2 border-b border-border py-2">
                <Button variant="ghost" className="h-auto min-h-[44px] flex-1 justify-start whitespace-normal text-left" onClick={() => setGuideId(module.id)} aria-label={`${module.title}, ${earnedBadge ? "completed" : reason(module) || "available"}`}>
                  <span className="text-2xl" aria-hidden="true">{badgeIcons[module.slug] || "★"}</span>
                  {earnedBadge ? <CheckCircle className="h-5 w-5 shrink-0" /> : !unlocked ? <Lock className="h-5 w-5 shrink-0" /> : null}
                  <div><h3 className="text-base font-semibold">{module.title}</h3>{!unlocked && <p className="text-xs text-muted-foreground">{reason(module)}</p>}</div>
                </Button>
                {earnedBadge && <Button variant="outline" className="min-h-[44px]" onClick={() => toggle(module.id)}>Review</Button>}
              </div>}
              <div className={cn("grid", !reduced && !justCompleted && "transition-[grid-template-rows] duration-300")} style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}>
                <div className="min-h-0">
                  {expanded && <div className="relative mx-auto w-[320px] max-w-full pt-10">
                    <svg viewBox={`0 0 320 ${height}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-10 w-full" style={{ height }} aria-hidden="true">
                      <defs><clipPath id={`completed-${module.id}`}><rect width="320" height={donePrefix > 1 ? 48 + (donePrefix - 1) * pathNodeSpacing : 0} /></clipPath></defs>
                      <path d={connector} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted" />
                      <m.path initial={false} animate={{ opacity: justCompleted?.moduleId === module.id && finishPhase < 2 ? 0 : 1, pathLength: justCompleted?.moduleId === module.id && finishPhase < 2 ? 0 : 1 }} transition={{ duration: reduced ? 0 : duration.slow }} d={connector} fill="none" stroke="currentColor" strokeWidth="4" className="learn-tier-color" clipPath={`url(#completed-${module.id})`} />
                    </svg>
                    {nodes.map((node, index) => {
                      const current = module.id === currentModuleId && node.current && node.unlocked;
                      const started = node.section ? startedSectionIds.has(node.id) : currentStarted;
                      const label = node.section ? `Lesson ${node.section}, ${node.title}, ${node.done ? "completed" : current ? "in progress" : node.unlocked ? "available" : "locked"}`
                        : `Badge check, ${earnedBadge ? "completed" : node.unlocked ? "available" : `locked, finish ${lessons.length} lessons first`}`;
                      const completedHere = node.id === finishedNode || !node.section && finishedNode === `quiz:${module.id}`;
                      const circle = <m.span initial={false} animate={{ scale: reduced ? 1 : completedHere && finishPhase === 1 ? 1.08 : 1 }} transition={{ duration: duration.normal }} className={cn("learn-path-circle relative inline-flex items-center justify-center rounded-full border-2 text-2xl font-bold",
                        node.section ? "h-[64px] w-[64px]" : "h-[72px] w-[72px]", node.done && (!completedHere || finishPhase >= 1) ? "learn-level-done" : node.unlocked ? "learn-node-open bg-card text-foreground" : "border-border bg-muted text-foreground")}>
                        {node.done && (!completedHere || finishPhase >= 1) ? <CheckCircle className="h-6 w-6" /> : premium ? <Crown className="h-6 w-6" /> : !node.unlocked ? <Lock className="h-6 w-6" /> : node.section ? <BookOpen className="h-6 w-6" /> : badgeIcons[module.slug] || "★"}
                      </m.span>;
                      return <m.div key={node.id} id={`learn-node-${node.section ? node.id : `quiz:${module.id}`}`} ref={current ? targetRef : undefined}
                        initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: duration.fast, delay: reduced ? 0 : index * 0.08 }}
                        className="learn-level-node relative flex flex-col items-center" style={{ height: pathNodeSpacing, marginLeft: pathOffsets[index % pathOffsets.length] * 2 }}>
                        {current && (!justCompleted || finishPhase >= 2) && <m.span data-current-bubble className="absolute -top-8 z-10 rounded-lg bg-primary px-3 py-1 text-sm font-bold text-primary-foreground"
                          animate={{ y: reduced ? 0 : [0,-4,0] }} transition={{ duration: 2, repeat: reduced ? 0 : Infinity, ease: easing.smooth }}>{started ? "Continue" : "Start"}</m.span>}
                        <Button variant="ghost" aria-label={label} title={node.title} className="learn-path-node relative h-[96px] w-[96px] rounded-full p-0 hover:bg-transparent"
                          onClick={() => { if (premium) navigate("/premium"); else if (!node.unlocked) toast.info(node.section ? "Complete previous badges first" : "Finish the lessons first, you're almost there."); else go(module, node.section || undefined); }}>
                          {completedHere && finishPhase < 3 ? <ProgressRing size={node.section ? 80 : 88} strokeWidth={4} percent={finishPhase >= 1 ? 100 : 0}>{circle}</ProgressRing> : current ? <ProgressRing size={node.section ? 80 : 88} strokeWidth={4} percent={moduleCompletionPercent(done, nodes.length, earnedBadge)}>{circle}</ProgressRing> : circle}
                        </Button>
                        <span className="max-w-[160px] text-center text-sm font-medium text-foreground">{node.section ? `Lesson ${node.section}` : "Badge Check"}</span>
                        <span className="max-w-[160px] text-center text-xs leading-tight text-muted-foreground">{node.section ? node.title : module.title}</span>
                      </m.div>;
                    })}
                  </div>}
                </div>
              </div>
            </section>;
          })}
          <div className="flex flex-col items-center gap-2 py-4">
            <Button variant="outline" className="h-[72px] w-[72px] rounded-full" aria-label={`${tierLabels[tier]} Review, ${earned >= 2 ? "available" : "locked, earn 2 badges in this tier to unlock"}`}
              onClick={() => { if (earned >= 2) navigate(`/learn/review/${tier}`); else toast.info("Earn 2 badges in this tier to unlock"); }}>
              {earned >= 2 ? <Trophy className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
            </Button><span className="text-sm font-semibold">{tierLabels[tier]} Review</span>
            {earned < 2 && <span className="text-xs text-muted-foreground">Earn 2 badges in this tier to unlock</span>}
          </div>
        </div>}
      </div>;
    })}
    {guide && <ModuleGuide module={guide} icon={badgeIcons[guide.slug] || "★"} reason={reason(guide)} premium={isAdvancedPremiumLocked(guide)} earned={earnedModuleIds.has(guide.id)}
      started={(moduleProgress[guide.id]?.completed || 0) > 0 || guide.id === currentModuleId && currentStarted}
      features={(modulesByTier[guide.tier || "foundation"] || []).filter(m => !earnedModuleIds.has(m.id)).length === 1 && !earnedModuleIds.has(guide.id)
        ? (tierFeatures.find(t => t.tier === guide.tier)?.features || []).map(f => f.label) : []}
      onClose={() => setGuideId(null)} onStart={() => startModule(guide)} onUpgrade={() => navigate("/premium")} />}
  </div>;
};
