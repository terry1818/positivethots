import { lazy, Suspense, useState, useEffect, useRef, useMemo } from "react";
import { Lock, CheckCircle, Crown, ChevronDown, BookOpen, Trophy, MessagesSquare, Dumbbell, Headphones, Package, PackageOpen } from "lucide-react";
import { m } from "motion/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { TierUnlock } from "@/hooks/useFeatureUnlocks";
import { mixedLevelNodes, type PathScenario } from "@/lib/mixedNodes";
import { type LessonSection } from "@/lib/learnLevels";
import { useSessionStore } from "@/stores/sessionStore";
import { ModuleGuide } from "./ModuleGuide";
import { GuideArt, tierGuide, type GuideName } from "@/components/mascot/GuideArt";
import { moduleCompletionPercent } from "@/lib/learnSmallFixes";
import { pathOffsets, pathNodeSpacing, windingConnector } from "@/lib/learnHome";
import { completedNodeId } from "@/lib/learnFinish";
import { duration, easing, spring } from "@/lib/motionTokens";
import { PathNode } from "./PathNode";
import { PathScenery } from "./PathScenery";
import { PathIcon, TierEmblem } from "./pathIcons";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { usePathAnimation } from "@/hooks/usePathAnimation";
import { Button } from "@/components/ui/button";

const PathChest = lazy(() => import("./PathChest"));

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
  scenarios: PathScenario[];
  optionalDone: Record<string,Set<string>>;
  questionModules: Set<string>;
  onChestClaim: (moduleId:string)=>void;
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
  sections, completedSectionIds, startedSectionIds, justCompleted, scenarios, optionalDone, questionModules, onChestClaim,
}: BadgePathMapProps) => {
  const navigate = useNavigate();
  const { ref: pathRef, running } = usePathAnimation<HTMLDivElement>();
  const [celebratingLevel, setCelebratingLevel] = useState(justCompleted?.node === "badge" ? justCompleted.moduleId : null);
  useEffect(() => {
    if (justCompleted?.node !== "badge") return;
    setCelebratingLevel(justCompleted.moduleId);
    const timer = setTimeout(() => setCelebratingLevel(null), 2500);
    return () => clearTimeout(timer);
  }, [justCompleted]);
  const [openNode, setOpenNode] = useState<string | null>(null);
  const { playNodeComplete, playTrailFill } = useSoundEffects();
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
    const timers = [setTimeout(() => { setFinishPhase(1); playNodeComplete(); }, 100), setTimeout(() => { setFinishPhase(2); playTrailFill(); }, 500), setTimeout(() => {
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
  const [chestId,setChestId]=useState<string|null>(null);
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
  // What a closed, unfinished level says under its banner. It must match the real lock state:
  // "Complete Foundation" only while Foundation is unfinished.
  const foundationDone = (modulesByTier.foundation || []).every(m => earnedModuleIds.has(m.id));
  const tierHint = (tier: string, modules: Module[]) => {
    if (tier === "foundation") return "";
    if (!foundationDone) return tier === "advanced" && !isPremium ? "Complete Foundation and get Premium" : "Complete Foundation to unlock";
    if (tier === "advanced" && !isPremium) return "Get Premium to unlock";
    return modules.some(m => !earnedModuleIds.has(m.id) && isModuleUnlocked(m)) ? "" : "Earn the badges these levels build on to unlock";
  };
  return <div ref={pathRef} role="list" aria-label="Learning path" className={cn("space-y-4", running ? "path-running" : "path-paused")} style={{ "--learn-header-height": `${headerHeight}px` } as React.CSSProperties}>
    {TIER_ORDER.map(tier => {
      const modules = modulesByTier[tier] || [];
      if (!modules.length) return null;
      const earned = modules.filter(m => earnedModuleIds.has(m.id)).length;
      const features = tierFeatures.find(t => t.tier === tier)?.features || [];
      const tierOpen = expandedTiers.has(tier);
      return <div key={tier} role="listitem" className={`learn-tier learn-tier-${tier}`}>
        <Button variant="ghost" className="path-tier-banner min-h-[44px] h-auto w-full whitespace-normal" onClick={() => toggle(tier, true)}
          aria-expanded={tierOpen} data-tour={tier === currentTier ? "learn-tier-active" : undefined} data-walkthrough={tier === currentTier ? "learn-tier-active" : undefined}>
          <span className="flex-1 min-w-0 text-left"><span className="block text-lg font-bold">{tierLabels[tier]}</span><span className="block text-sm">{earned} of {modules.length} levels complete</span><span className="path-tier-progress"><span style={{ width: `${earned / modules.length * 100}%` }}/></span></span><GuideArt name={tierGuide(tier)} size={96}/><ChevronDown className={cn("h-4 w-4", tierOpen && "rotate-180")} />
        </Button>
        {!tierOpen && earned < modules.length && tierHint(tier, modules) && <p className="text-center text-sm text-muted-foreground">{tierHint(tier, modules)}</p>}
        {tierOpen && <div className="space-y-4">
          {modules.map((module, levelIndex) => {
            const earnedBadge = earnedModuleIds.has(module.id);
            const unlocked = earnedBadge || isModuleUnlocked(module);
            const premium = isAdvancedPremiumLocked(module);
            const expanded = expandedLevels.has(module.id);
            const lessons = moduleSections(module.id);
            const mandatory = lessons.length + 1;
            const nodes = mixedLevelNodes(lessons, completedSectionIds, earnedBadge, unlocked, module.tier||"", scenarios.filter(s=>s.module_id===module.id),optionalDone[module.id]||new Set(),questionModules.has(module.id));
            const done = nodes.filter(n => n.done && (n.kind==="lesson"||n.kind==="badge")).length;
            const connector = windingConnector(nodes.length).replace(/\b48\b/, "52");
            const height = 52 + (nodes.length - 1) * pathNodeSpacing;
            const firstIncomplete = nodes.findIndex(n => !n.done);
            const donePrefix = firstIncomplete < 0 ? nodes.length : firstIncomplete;
            const artNames: Record<string, GuideName> = { lesson: "guide-lesson-reading", story: "guide-story-chat", practice: "guide-practice-dumbbell", listen: "guide-listen-headphones", chest: "guide-chest-open", badge: "guide-graduate" };
            const selectedArt = nodes.findIndex(n => openNode === (n.section ? n.id : n.kind === "badge" ? `quiz:${module.id}` : `${module.id}:${n.id}`));
            const artIndex = selectedArt >= 0 ? selectedArt : Math.max(0, nodes.findIndex(n => n.current && n.unlocked));
            const artSpots = [artIndex, ...nodes.map((n, i) => n.kind !== "lesson" && i > artIndex && (n.kind !== "chest" || n.unlocked || n.done) ? i : -1).filter(i => i >= 0)].map((i, order) => ({ index: i, offset: order === 0 ? pathOffsets[i % pathOffsets.length] : -pathOffsets[artIndex % pathOffsets.length], name: nodes[i].kind === "lesson" && nodes[i].section === 1 && !startedSectionIds.has(nodes[i].id) && !nodes[i].done ? "guide-waving" as const : artNames[nodes[i].kind] }));
            return <section key={module.id} aria-label={module.title} className="learn-level-block">
              {expanded ? <header className={cn("learn-level-band sticky z-20 flex items-center gap-2 px-3 py-4", justCompleted?.moduleId === module.id && justCompleted.node === "badge" && finishPhase < 3 && "path-level-celebrating")} style={{ top: headerHeight }}>
                <span className="path-level-number">{levelIndex + 1}</span>
                <div className="min-w-0 flex-1"><p className="text-xs">{tierLabels[tier].replace(" (Required)", "")} - Level {levelIndex + 1} of {modules.length}</p><h3 className="text-base font-bold leading-snug mt-1">{module.title}</h3><div className="path-level-pips" aria-label={`${done} of ${mandatory} lessons and badge completed`}>{nodes.map(n => <i key={n.id} className={n.done ? "path-pip-done" : ""}/>)}</div></div>
                <Button variant="outline" className="path-guide-button" onClick={() => setGuideId(module.id)}><PathIcon kind="lesson"/>Guide</Button>
                {module.id !== currentModuleId && <Button variant="ghost" size="icon" aria-label={`Collapse ${module.title}`} onClick={() => toggle(module.id)}><ChevronDown /></Button>}
              </header> : <div className={cn("path-level-row flex min-h-[80px] items-center gap-2 py-3", earnedBadge && "path-completed-row")}>
                <Button variant="ghost" className="h-auto min-h-[44px] flex-1 justify-start whitespace-normal text-left text-foreground" onClick={() => setGuideId(module.id)} aria-label={`${module.title}, ${earnedBadge ? "completed" : reason(module) || "available"}`}>
                  <span className="path-row-medal"><PathIcon kind={earnedBadge ? "badge" : !unlocked ? "lock" : "lesson"}/></span>
                  <div><h3 className="text-base font-semibold">{module.title}</h3>{!unlocked && <p className="text-xs text-muted-foreground">{reason(module)}</p>}</div>
                </Button>
                {earnedBadge && <CompletedLevelArt moduleId={module.id} celebrating={celebratingLevel === module.id}/>}
                {earnedBadge && <Button variant="outline" className="path-review-chip" onClick={() => toggle(module.id)}>Review</Button>}
              </div>}
              <div className={cn("grid", !reduced && !justCompleted && "transition-[grid-template-rows] duration-300")} style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}>
                <div className="min-h-0">
                  {expanded && <div className="path-level-stage relative mx-auto w-[320px] max-w-full pt-10">
                    <PathScenery spots={artSpots} celebration={celebratingLevel === module.id}/>
                    <svg viewBox={`0 0 320 ${height}`} preserveAspectRatio="none" className="path-trail pointer-events-none absolute inset-x-0 top-10 w-full" style={{ height }} aria-hidden="true">
                      <defs><clipPath id={`completed-${module.id}`}><rect width="320" height={donePrefix > 0 ? 52 + Math.min(donePrefix, nodes.length - 1) * pathNodeSpacing : 0}/></clipPath></defs>
                      <path d={connector} className="path-trail-track"/>
                      <m.path initial={false} animate={{ opacity: justCompleted?.moduleId === module.id && finishPhase < 2 ? 0.4 : 1, pathLength: justCompleted?.moduleId === module.id && finishPhase < 2 ? 0 : 1 }} transition={{ duration: reduced ? 0.1 : 0.5 }} d={connector} className="path-trail-fill" clipPath={`url(#completed-${module.id})`}/>{justCompleted?.moduleId === module.id && finishPhase === 2 && !reduced && <circle r="6" className="path-flow-dot"><animateMotion dur=".5s" repeatCount="1" path={connector}/></circle>}
                      {!reduced && running && nodes.some(n => n.current && n.unlocked) && <g className="path-flow-dots">{[0, 0.8, 1.6].map(delay => <circle key={delay} r="3" className="path-flow-dot"><animateMotion dur="2.4s" repeatCount="indefinite" begin={`${delay}s`} path={windingConnector(Math.max(2, nodes.findIndex(n => n.current) + 1))} keyPoints="0.6;1" keyTimes="0;1" calcMode="linear"/></circle>)}</g>}
                    </svg>
                    {nodes.map((node, index) => {
                      const current = module.id === currentModuleId && node.current && node.unlocked;
                      const started = node.section ? startedSectionIds.has(node.id) : currentStarted;
                      const optional = node.kind !== "lesson" && node.kind !== "badge";
                      const label = optional ? `${node.kind === "story" ? "Story" : node.title}, ${node.title}, ${node.done ? "completed" : node.unlocked ? "available" : "locked"}` : node.section ? `Lesson ${node.section}, ${node.title}, ${node.done ? "completed" : current ? "in progress" : node.unlocked ? "available" : "locked"}` : `Badge check, ${earnedBadge ? "completed" : node.unlocked ? "available" : `locked, finish ${lessons.length} lessons first`}`;
                      const completedHere = node.id === finishedNode || node.kind === "badge" && finishedNode === `quiz:${module.id}` || optional && finishedNode === `${module.id}:${node.id}`;
                      const nodeId = node.section ? node.id : node.kind === "badge" ? `quiz:${module.id}` : `${module.id}:${node.id}`;
                      const minutes = Math.max(1, Math.round((module.estimated_minutes || 12) / Math.max(1, lessons.length)));
                      return <div key={node.id} id={`learn-node-${nodeId}`} ref={current ? targetRef : undefined} className="learn-level-node relative flex flex-col items-center" style={{ height: pathNodeSpacing, marginLeft: pathOffsets[index % pathOffsets.length] * 2 }}>
                        <PathNode id={nodeId} tier={tier} kind={node.kind} label={label} title={node.kind === "badge" ? module.title : node.title} subtitle={node.section ? `${node.section}|About ${minutes || 3} min · +10 XP` : node.kind === "practice" || node.kind === "listen" ? "+5 XP" : node.kind === "chest" ? node.done ? "Opened" : "A little reward for your progress" : "Keep learning, one step at a time"} state={node.done ? "done" : premium ? "premium-locked" : current ? "current" : node.unlocked ? "available" : "locked"} started={started} progress={moduleCompletionPercent(done, mandatory, earnedBadge)} reason={premium ? reason(module) : node.kind === "chest" ? "Finish 2 lessons to open" : node.section ? "Complete previous lessons first" : "Finish the lessons first, you're almost there."} index={index} celebrate={completedHere && finishPhase === 1} hop={Boolean(justCompleted && finishPhase >= 2)} bubble={!justCompleted || finishPhase >= 2} open={openNode === nodeId} onOpenChange={value => setOpenNode(value ? nodeId : null)} onGo={() => { if (node.kind === "chest") { if (!node.done) setChestId(module.id); } else if (node.kind === "story") navigate(`/learn/${module.slug}/story/${node.scenarioSlug}`); else if (node.kind === "practice" || node.kind === "listen") navigate(`/learn/${module.slug}/${node.kind}`); else go(module, node.section || undefined); }}/>
                      </div>;
                    })}
                  </div>}
                </div>
              </div>
            </section>;
          })}
          <div className="flex justify-center items-center gap-8 py-8"><GuideArt name="guide-trophy" size={112}/><PathNode id={`review-${tier}`} tier={tier} kind="review" label={`${tierLabels[tier]} Review, ${earned >= 2 ? "available" : "locked, earn 2 badges in this tier to unlock"}`} title={`${tierLabels[tier]} Review`} subtitle="+30 XP" state={earned >= 2 ? "available" : "locked"} reason="Earn 2 badges in this tier to unlock" open={openNode === `review-${tier}`} onOpenChange={value => setOpenNode(value ? `review-${tier}` : null)} onGo={() => navigate(`/learn/review/${tier}`)}/></div>
        </div>}
      </div>;
    })}
    {chestId && <Suspense fallback={<p role="status">Opening your chest…</p>}><PathChest moduleId={chestId} onClose={()=>setChestId(null)} onClaim={()=>onChestClaim(chestId)}/></Suspense>}
    {guide && <ModuleGuide module={guide} icon={badgeIcons[guide.slug] || "★"} reason={reason(guide)} premium={isAdvancedPremiumLocked(guide)} earned={earnedModuleIds.has(guide.id)}
      started={(moduleProgress[guide.id]?.completed || 0) > 0 || guide.id === currentModuleId && currentStarted}
      features={(modulesByTier[guide.tier || "foundation"] || []).filter(m => !earnedModuleIds.has(m.id)).length === 1 && !earnedModuleIds.has(guide.id)
        ? (tierFeatures.find(t => t.tier === guide.tier)?.features || []).map(f => f.label) : []}
      onClose={() => setGuideId(null)} onStart={() => startModule(guide)} onUpgrade={() => navigate("/premium")} />}
  </div>;
};

function CompletedLevelArt({ moduleId, celebrating }: { moduleId: string; celebrating: boolean }) {
  const { ref, visible } = usePathAnimation<HTMLSpanElement>();
  const [show, setShow] = useState(false);
  const seen = useRef(false);
  useEffect(() => {
    if (!visible || seen.current || useSessionStore.getState().isBannerDismissed(`guide-level:${moduleId}`)) return;
    seen.current = true; useSessionStore.getState().dismissBanner(`guide-level:${moduleId}`); setShow(true);
  }, [visible, moduleId]);
  useEffect(() => { if (!show) return; const timer = setTimeout(() => setShow(false), 2500); return () => clearTimeout(timer); }, [show]);
  return <span ref={ref} className="path-completed-guide-slot">{(show || celebrating) && <GuideArt name="guide-high-five" size={64}/>}</span>;
}
