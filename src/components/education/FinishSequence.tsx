import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { m } from "motion/react";
import { Flame, Share2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/Mascot";
import { EducationBadge } from "@/components/EducationBadge";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { getLevelName, LEVEL_REWARDS, isStreakMilestone } from "@/hooks/useLearningStats";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { duration, spring } from "@/lib/motionTokens";
import { finishSteps, type FinishData } from "@/lib/learnFinish";
const CelebrationEngine = lazy(() => import("@/components/celebrations/CelebrationEngine").then(m => ({ default: m.CelebrationEngine })));
const ShareCard = lazy(() => import("@/components/ShareableAchievementCard").then(m => ({ default: m.ShareableAchievementCard })));
const StorySummary = lazy(() => import("./scenarios/ScenarioSummary").then(m => ({ default: m.ScenarioSummary })));

export default function FinishSequence({ data, onBack, onDiscovery }: { data: FinishData; onBack: () => void; onDiscovery?: () => void }) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [share, setShare] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const played = useRef(new Set<string>());
  const { playBadgeUnlock, playStreakMilestone } = useSoundEffects();
  const steps = finishSteps(data); const step = steps[index] || steps[steps.length - 1];
  const last = index >= steps.length - 1;
  const foundation = step === "tier" && data.tier === "foundation";
  const title = step === "lesson" ? "Lesson complete!" : step === "streak" ? "Streak" : step === "badge" ? "Badge earned!" : step === "results" ? "Your results" : step === "level" ? "Level up" : step === "tier" ? foundation ? "Discovery is open" : `${data.tierLabel} complete!` : data.kind === "story" ? "Story complete" : data.kind === "practice" ? "Practice complete" : data.kind === "listen" ? "Listen complete" : "Review complete";
  const next = () => last ? onBack() : setIndex(i => i + 1);
  useEffect(() => {
    heading.current?.focus();
    if (played.current.has(step)) return;
    played.current.add(step);
    if (step === "badge") playBadgeUnlock(); // includes the existing heavy haptic
    if (step === "streak" && isStreakMilestone(data.streak || 0)) playStreakMilestone();
  }, [step, data.streak, playBadgeUnlock, playStreakMilestone]);
  const xp = data.xp === null ? "—" : data.xp === 0 ? "XP already earned" : `+${data.xp}`;
  const stats = step === "lesson" ? [
    { label: "XP", value: xp, counter: data.xp },
    { label: "Checkpoints", value: `${data.checkpoints || 0} of ${data.checkpointTotal || 0}` },
    { label: "Time", value: `${Math.floor((data.seconds || 0) / 60)}m ${(data.seconds || 0) % 60}s` },
  ] : step === "results" || step === "review" ? [
    { label: "XP", value: xp, counter: data.xp },
    { label: "First-try accuracy", value: `${data.accuracy || 0}%` },
    { label: "Questions", value: String(data.questions || 0) },
  ] : [];
  return <main className="min-h-[100dvh] flex flex-col bg-background px-4 pt-[max(24px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))]" onKeyDown={event => {
    if (event.key === "Enter" && !share && (event.target === heading.current || event.target === event.currentTarget)) { event.preventDefault(); next(); }
  }}>
    {step === "badge" && !reduced && <Suspense fallback={null}><CelebrationEngine tier="large" trigger={1} confettiOnly /></Suspense>}
    <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full max-w-[480px] mx-auto text-center pb-24">
      <h1 key={step} ref={heading} tabIndex={-1} className="text-3xl font-bold outline-none">{title}</h1>
      <Button className="fixed bottom-[max(24px,env(safe-area-inset-bottom))] left-4 right-4 mx-auto max-w-[480px] min-h-[52px] z-20" onClick={foundation ? onDiscovery : next}>{foundation ? "Explore Discovery" : last ? "Back to my path" : "Continue"}</Button>
      {step === "lesson" && <Mascot mood="celebration" size="lg" animate={!reduced} />}
      {data.replay && <p>Replay - no XP this time</p>}
      {data.storySummary && <Suspense fallback={null}><StorySummary embedded title={data.title} xpReward={data.xp || 0} {...data.storySummary} /></Suspense>}
      {step === "badge" && <><div className="flex items-center justify-center gap-4"><m.div initial={reduced ? false : { scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: duration.slow }} className={reduced ? "" : "rounded-full bg-primary/10"}><EducationBadge moduleSlug={data.slug} title={data.title} tier={data.tier} isEarned size="lg" /></m.div><Mascot mood="graduate" size="md" animate={!reduced} /></div><p className="text-xl font-semibold">{data.title}</p></>}
      {step === "streak" && <><Flame aria-hidden className="h-16 w-16 text-accent" /><span aria-hidden className="text-5xl font-bold"><AnimatedCounter start={data.oldStreak || 0} end={data.streak || 0} duration={700} /></span><p>{data.streak} days of learning</p></>}
      {step === "level" && <><Star aria-hidden className="h-16 w-16 text-accent" /><p className="text-3xl font-bold">Level {data.level} · {getLevelName(data.level || 1)}</p>{LEVEL_REWARDS[data.level || 0] && <p>{LEVEL_REWARDS[data.level || 0].icon} {LEVEL_REWARDS[data.level || 0].label}</p>}</>}
      {stats.length > 0 && <><div className="grid grid-cols-3 gap-2 w-full" aria-hidden>{stats.map((stat, i) => <m.div key={stat.label} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: duration.normal, delay: reduced ? 0 : i * 0.08 }} className="rounded-lg border border-border bg-card p-3 min-h-[96px] flex flex-col justify-center"><p className="font-bold break-words">{typeof stat.counter === "number" && stat.counter > 0 ? <AnimatedCounter end={stat.counter} prefix="+" duration={700} /> : stat.value}</p><p className="text-sm text-muted-foreground">{stat.label}</p></m.div>)}</div><p className="sr-only" role="status" aria-live="polite">{stats.map(s => `${s.label}: ${s.value}`).join(". ")}</p></>}
      {step === "lesson" && <p className="text-muted-foreground">{data.firstLessonToday ? `Day ${data.streak || 0} of your streak` : data.lessonsDone === data.lessonTotal ? "Badge check unlocked" : `${data.lessonsDone} of ${data.lessonTotal} lessons done`}</p>}
      {step === "results" && <Button variant="ghost" className="min-h-11 gap-2" onClick={() => setShare(true)}><Share2 className="h-4 w-4" />Share</Button>}
      {step === "tier" && <><ul className="space-y-2">{data.features?.map(feature => <li key={feature}>{feature}</li>)}</ul>{foundation && <Button variant="outline" className="w-full min-h-[52px]" onClick={onBack}>Back to my path</Button>}</>}
      {data.saving && <p role="status" className="text-sm text-muted-foreground">We're still saving your progress</p>}
    </div>
    {share && <Suspense fallback={null}><ShareCard open onClose={() => setShare(false)} data={{ type: "badge_earned", badgeName: data.title }} /></Suspense>}
  </main>;
}