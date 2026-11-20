import { GuideArt } from "@/components/mascot/GuideArt";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Flame, Sparkles, Gift, Trophy, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomSheet } from "@/components/motion/BottomSheet";
import { supabase } from "@/integrations/supabase/client";
import { highlightedTodayChip } from "@/lib/learnHome";
import { cn } from "@/lib/utils";
import { BrandedEmptyState } from "@/components/BrandedEmptyState";

const StreakCalendar = lazy(() => import("./StreakCalendar").then(m => ({ default: m.StreakCalendar })));
const DailyChallenge = lazy(() => import("./DailyChallenge").then(m => ({ default: m.DailyChallenge })));
const DailySpinWheel = lazy(() => import("./DailySpinWheel").then(m => ({ default: m.DailySpinWheel })));
const WeeklySprintBanner = lazy(() => import("./sprints/WeeklySprintBanner").then(m => ({ default: m.WeeklySprintBanner })));
const CommunityChallengeCard = lazy(() => import("./CommunityChallengeCard").then(m => ({ default: m.CommunityChallengeCard })));
type Activity = "streak" | "challenge" | "spin" | "sprint" | "community";

export function LearnToday({ streak, lastActivityDate, freezes, atRisk, hoursLeft, hasSpunToday, onReward, bonusReady, openBonus }: {
  streak: number; lastActivityDate: string | null; freezes: number; atRisk: boolean; hoursLeft: number;
  hasSpunToday: boolean; onReward: React.ComponentProps<typeof DailySpinWheel>["onReward"];
  bonusReady: boolean; openBonus: () => void;
}) {
  const [sheet, setSheet] = useState<Activity | null>(null);
  const [challengeDone, setChallengeDone] = useState<boolean | null>(null);
  const [more, setMore] = useState(false);
  const [activityAvailable, setActivityAvailable] = useState<Partial<Record<Activity, boolean>>>({});
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (sheet !== "sprint" && sheet !== "community") return;
    let active = true;
    const table = sheet === "sprint" ? "weekly_sprints" : "community_challenges";
    void supabase.from(table).select("id").eq("is_active", true).limit(1).then(({ data, error }) => {
      if (active && !error) setActivityAvailable(previous => ({ ...previous, [sheet]: Boolean(data?.length) }));
    });
    return () => { active = false; };
  }, [sheet]);
  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data, error } = await supabase.from("daily_challenges").select("completed")
        .eq("user_id", session.user.id).eq("challenge_date", new Date().toISOString().slice(0, 10)).maybeSingle();
      if (active && !error) setChallengeDone(data?.completed ?? false);
    };
    void load();
    return () => { active = false; };
  }, [sheet]);
  useEffect(() => {
    const element = row.current;
    if (!element) return;
    const update = () => setMore(element.scrollWidth - element.clientWidth - element.scrollLeft > 2);
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener("scroll", update, { passive: true });
    update();
    return () => { observer.disconnect(); element.removeEventListener("scroll", update); };
  }, [bonusReady]);
  const highlighted = highlightedTodayChip(atRisk, bonusReady, !hasSpunToday, challengeDone === false);
  const chips = [
    { id: "streak" as const, title: "Streak", label: atRisk ? `${hoursLeft}h left` : `${streak} day${streak === 1 ? "" : "s"}`, state: atRisk ? `at risk, ${hoursLeft} hours left` : `${streak} days`, icon: Flame, dot: false },
    { id: "challenge" as const, title: "Daily challenge", label: "Daily challenge", state: challengeDone === null ? "loading" : challengeDone ? "complete" : "not done", icon: Target, dot: challengeDone === false },
    { id: "spin" as const, title: "Daily spin", label: "Daily spin", state: hasSpunToday ? "claimed today" : "available", icon: Sparkles, dot: !hasSpunToday },
    { id: "sprint" as const, title: "Weekly sprint", label: "Weekly sprint", state: "open", icon: Trophy, dot: false },
    { id: "community" as const, title: "Community", label: "Community", state: "open", icon: Users, dot: false },
  ];
  const title = chips.find(chip => chip.id === sheet)?.title || "Today";
  return <section aria-label="Today" className="space-y-2">
    <h2 className="text-sm font-semibold">Today</h2>
    <div className="relative">
      <div ref={row} className="learn-today-scroll flex gap-2 overflow-x-auto pb-1">
        {chips.map(({ id, title, label, state, icon: Icon, dot }) => <Button key={id} variant="secondary"
          className={cn("h-[44px] min-h-[44px] shrink-0 gap-2 rounded-full bg-muted text-foreground", highlighted === id && "learn-chip-highlight", id === "streak" && "learn-streak-chip")}
          aria-label={`${title}, ${state}`} onClick={() => setSheet(id)}
          data-tour={id === "challenge" ? "learn-daily-challenge" : `learn-${id}`}
          data-walkthrough={id === "challenge" ? "learn-daily-challenge" : `learn-${id}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />{label}{dot && <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />}
        </Button>)}
        {bonusReady && <Button variant="secondary" onClick={openBonus} aria-label="Daily bonus, unclaimed"
          className={cn("h-[44px] min-h-[44px] shrink-0 gap-2 rounded-full bg-muted text-foreground", highlighted === "bonus" && "learn-chip-highlight")}>
          <Gift className="h-4 w-4" aria-hidden="true" />Daily bonus
        </Button>}
      </div>
      {more && <div aria-hidden="true" className="learn-today-fade pointer-events-none absolute inset-y-0 right-0 w-8" />}
    </div>
    <BottomSheet open={sheet !== null} onOpenChange={open => { if (!open) setSheet(null); }} title={title}>
      <div className="max-h-[65dvh] overflow-y-auto">
        {sheet && <div className="text-center pb-4"><GuideArt name={sheet === "streak" ? atRisk ? "guide-sleepy" : "guide-streak-flame" : sheet === "spin" ? "guide-daily-spin" : sheet === "sprint" || sheet === "community" ? "guide-study-together" : "guide-lesson-reading"} size={144}/></div>}
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
          {sheet === "streak" && <StreakCalendar streak={streak} lastActivityDate={lastActivityDate} freezeCount={freezes} />}
          {sheet === "challenge" && <DailyChallenge />}
          {sheet === "spin" && <DailySpinWheel hasSpunToday={hasSpunToday} onReward={onReward} />}
          {sheet === "sprint" && <WeeklySprintBanner />}
          {sheet === "community" && <CommunityChallengeCard />}
          {(sheet === "sprint" || sheet === "community") && activityAvailable[sheet] === false &&
            <BrandedEmptyState illustration={<GuideArt name="guide-waving" size={160}/>} mascot="waving" headline={sheet === "sprint" ? "The next sprint is on the way." : "New community goals are on the way."}
              description="Keep learning while you wait." />}
        </Suspense>
      </div>
    </BottomSheet>
  </section>;
}