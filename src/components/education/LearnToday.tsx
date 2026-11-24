import { GuideArt } from "@/components/mascot/GuideArt";
import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import { Check, ChevronRight, Flame, Gift, Sparkles, Target, Trophy, Users, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomSheet } from "@/components/motion/BottomSheet";
import { highlightedTodayChip } from "@/lib/learnHome";
import {
  challengeHint, challengeLabel, daysLeftLabel, fetchDailyChallenge, fetchWeek, nextSprintMark, rewardLabel, SPRINT_MARKS,
  type DailyChallengeState, type WeekState,
} from "@/lib/learnWeek";

const StreakCalendar = lazy(() => import("./StreakCalendar").then(m => ({ default: m.StreakCalendar })));
const DailySpinWheel = lazy(() => import("./DailySpinWheel").then(m => ({ default: m.DailySpinWheel })));
type Activity = "streak" | "challenge" | "spin" | "sprint" | "community";
type Loadable<T> = { state: "loading" } | { state: "error" } | { state: "ready"; value: T };

const pct = (done: number, of: number) => Math.max(0, Math.min(100, of > 0 ? Math.round((done / of) * 100) : 0));

/** One line of the checklist: what it is, where it stands, and a tick when it is done. Every line is one tap. */
function Row({ id, icon: Icon, tone, title, note, done, next, progress, onOpen, tour }: {
  id: Activity | "bonus"; icon: LucideIcon; tone: string; title: string; note: ReactNode; done: boolean; next: boolean;
  progress?: number; onOpen: () => void; tour?: string;
}) {
  return (
    <li>
      <button type="button" className={next ? "kit-row kit-row-next today-row" : "kit-row today-row"} onClick={onOpen}
        data-done={done ? "true" : undefined} data-tour={tour} data-walkthrough={tour} data-today={id}>
        <span className="kit-coin" data-tone={done ? "correct" : tone}>{done ? <Check aria-hidden="true" /> : <Icon aria-hidden="true" />}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold leading-tight">{title}</span>
          <span className="block text-sm text-muted-foreground [text-wrap:pretty]">{note}</span>
          {progress !== undefined && !done && (
            <span className="kit-progress mt-1.5 block" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${title} progress`}>
              <span style={{ width: `${progress}%` }} />
            </span>
          )}
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>
    </li>
  );
}

export function LearnToday({ streak, lastActivityDate, freezes, atRisk, hoursLeft, hasSpunToday, onSpin, bonusReady, openBonus }: {
  streak: number; lastActivityDate: string | null; freezes: number; atRisk: boolean; hoursLeft: number;
  hasSpunToday: boolean; onSpin: React.ComponentProps<typeof DailySpinWheel>["onSpin"];
  bonusReady: boolean; openBonus: () => void;
}) {
  const [sheet, setSheet] = useState<Activity | null>(null);
  const [challenge, setChallenge] = useState<Loadable<DailyChallengeState>>({ state: "loading" });
  const [week, setWeek] = useState<Loadable<WeekState>>({ state: "loading" });

  const load = useCallback(() => {
    fetchDailyChallenge().then(value => setChallenge({ state: "ready", value })).catch(() => setChallenge({ state: "error" }));
    fetchWeek().then(value => setWeek({ state: "ready", value })).catch(() => setWeek({ state: "error" }));
  }, []);
  // Asked again when a sheet closes and when the member comes back to the tab, so a finished lesson shows up.
  useEffect(() => { if (sheet === null) load(); }, [sheet, load]);
  useEffect(() => {
    const onShow = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  }, [load]);

  const ch = challenge.state === "ready" ? challenge.value : null;
  const wk = week.state === "ready" ? week.value : null;
  const highlighted = highlightedTodayChip(atRisk, bonusReady, !hasSpunToday, ch ? !ch.completed : false);
  const doneToday = (lastActivityDate === new Date().toISOString().slice(0, 10) ? 1 : 0) + (ch?.completed ? 1 : 0) + (hasSpunToday ? 1 : 0);
  const mark = wk ? nextSprintMark(wk.sprint.xp) : null;
  const learnedToday = lastActivityDate === new Date().toISOString().slice(0, 10);
  const titles: Record<Activity, string> = { streak: "Streak", challenge: "Daily challenge", spin: "Daily spin", sprint: "Weekly sprint", community: "Community goal" };

  return <section aria-label="Today" className="kit-area-learn space-y-4">
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-extrabold">Today</h2>
        <p className="text-sm font-bold text-muted-foreground" aria-label={`${doneToday} of 3 done today`}>{doneToday} of 3 done</p>
      </div>
      <ul className="space-y-2">
        <Row id="streak" icon={Flame} tone="urgent" title={streak > 0 ? `${streak}-day streak` : "Start a streak"} done={learnedToday && !atRisk} next={highlighted === "streak"}
          note={atRisk ? `Finish a lesson in the next ${hoursLeft}h to keep it` : learnedToday ? "Kept for today" : "Finish one lesson today"}
          onOpen={() => setSheet("streak")} tour="learn-streak" />
        <Row id="challenge" icon={Target} tone="area" title={ch ? challengeLabel(ch) : "Daily challenge"} done={!!ch?.completed} next={highlighted === "challenge"}
          note={challenge.state === "loading" ? "Loading…" : challenge.state === "error" ? "Couldn't load. Tap to try again." : ch!.completed ? `Done. You earned ${rewardLabel(ch!.reward) ?? "today's reward"}.` : `${ch!.progress} of ${ch!.target} · Earns ${rewardLabel(ch!.reward) ?? "a reward"}`}
          progress={ch ? pct(ch.progress, ch.target) : undefined}
          onOpen={() => (challenge.state === "error" ? load() : setSheet("challenge"))} tour="learn-daily-challenge" />
        <Row id="spin" icon={Sparkles} tone="reward" title="Daily spin" done={hasSpunToday} next={highlighted === "spin"}
          note={hasSpunToday ? "Claimed. Come back tomorrow." : "One free spin is waiting"} onOpen={() => setSheet("spin")} tour="learn-spin" />
        {bonusReady && <Row id="bonus" icon={Gift} tone="highlight" title="Daily bonus" done={false} next={highlighted === "bonus"} note="Ready to claim" onOpen={openBonus} />}
      </ul>
    </div>

    <div className="space-y-2">
      <h2 className="text-base font-extrabold">This week</h2>
      {week.state === "loading" ? <div className="space-y-2" aria-busy="true"><Skeleton className="h-[72px] w-full rounded-2xl" /><Skeleton className="h-[72px] w-full rounded-2xl" /></div>
        : week.state === "error" ? (
          <button type="button" className="kit-row today-row" onClick={load}>
            <span className="kit-coin" data-tone="quiet"><Trophy aria-hidden="true" /></span>
            <span className="min-w-0 flex-1"><span className="block font-bold leading-tight">We couldn't load this week</span><span className="block text-sm text-muted-foreground">Tap to try again.</span></span>
          </button>
        ) : (
          <ul className="space-y-2">
            <Row id="sprint" icon={Trophy} tone="reward" title="Weekly sprint" done={!mark} next={false}
              note={mark ? `${wk!.sprint.xp} of ${mark.xp} XP to ${mark.name} · ${daysLeftLabel(wk!.sprint.ends_at)}` : "Gold reached. All three rewards are yours."}
              progress={mark ? pct(wk!.sprint.xp, mark.xp) : undefined} onOpen={() => setSheet("sprint")} tour="learn-sprint" />
            {wk!.goal.title && <Row id="community" icon={Users} tone="info" title={wk!.goal.title} done={wk!.goal.completed} next={false}
              note={wk!.goal.completed ? "Reached together. Thank you." : `${wk!.goal.progress.toLocaleString()} of ${(wk!.goal.target ?? 0).toLocaleString()} · ${daysLeftLabel(wk!.goal.ends_at)}`}
              progress={pct(wk!.goal.progress, wk!.goal.target ?? 0)} onOpen={() => setSheet("community")} tour="learn-community" />}
          </ul>
        )}
    </div>

    <BottomSheet open={sheet !== null} onOpenChange={open => { if (!open) setSheet(null); }} title={sheet ? titles[sheet] : "Today"}>
      <div className="kit-area-learn max-h-[65dvh] overflow-y-auto">
        {sheet && sheet !== "spin" && <div className="pb-4 text-center"><GuideArt name={sheet === "streak" ? atRisk ? "guide-sleepy" : "guide-streak-flame" : sheet === "challenge" ? "guide-lesson-reading" : "guide-study-together"} size={144} /></div>}
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
          {sheet === "streak" && <StreakCalendar streak={streak} lastActivityDate={lastActivityDate} freezeCount={freezes} />}
          {sheet === "spin" && <DailySpinWheel hasSpunToday={hasSpunToday} onSpin={onSpin} streak={streak} />}
        </Suspense>

        {sheet === "challenge" && ch && (
          <div className="space-y-3 text-center">
            <h3 className="text-xl font-extrabold [text-wrap:balance]">{challengeLabel(ch)}</h3>
            {challengeHint(ch.type) && <p className="text-muted-foreground [text-wrap:pretty]">{challengeHint(ch.type)}</p>}
            <div className="kit-progress" role="progressbar" aria-valuenow={pct(ch.progress, ch.target)} aria-valuemin={0} aria-valuemax={100} aria-label="Challenge progress"><span style={{ width: `${pct(ch.progress, ch.target)}%` }} /></div>
            <p className="font-bold">{ch.completed ? `Done. You earned ${rewardLabel(ch.reward) ?? "today's reward"}.` : `${ch.progress} of ${ch.target} · Finish it to earn ${rewardLabel(ch.reward) ?? "a reward"}`}</p>
            <p className="text-sm text-muted-foreground">A new challenge arrives every day, and never the same kind twice in a row.</p>
          </div>
        )}

        {sheet === "sprint" && wk && (
          <div className="space-y-3">
            <p className="text-center text-muted-foreground [text-wrap:pretty]">Everything you learn this week adds up. Reach a mark, keep the reward. {daysLeftLabel(wk.sprint.ends_at)}.</p>
            <p className="text-center text-3xl font-black tabular-nums">{wk.sprint.xp} <span className="text-base font-bold text-muted-foreground">XP this week</span></p>
            <ul className="space-y-2">
              {SPRINT_MARKS.map((m, i) => {
                const reached = wk.sprint.tier > i;
                return (
                  <li key={m.name} className="kit-row" data-done={reached ? "true" : undefined}>
                    <span className="kit-coin" data-tone={reached ? "correct" : "reward"}>{reached ? <Check aria-hidden="true" /> : <Trophy aria-hidden="true" />}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold leading-tight">{m.name} · {m.xp} XP</span>
                      <span className="block text-sm text-muted-foreground">{reached ? `Earned: ${m.reward}` : `Earns ${m.reward}`}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {sheet === "community" && wk && wk.goal.title && (
          <div className="space-y-3 text-center">
            <h3 className="text-xl font-extrabold [text-wrap:balance]">{wk.goal.title}</h3>
            <p className="text-muted-foreground [text-wrap:pretty]">{wk.goal.description}</p>
            <div className="kit-progress" role="progressbar" aria-valuenow={pct(wk.goal.progress, wk.goal.target ?? 0)} aria-valuemin={0} aria-valuemax={100} aria-label="Community goal progress"><span style={{ width: `${pct(wk.goal.progress, wk.goal.target ?? 0)}%` }} /></div>
            <p className="font-bold tabular-nums">{wk.goal.progress.toLocaleString()} of {(wk.goal.target ?? 0).toLocaleString()} · {wk.goal.completed ? "Reached" : daysLeftLabel(wk.goal.ends_at)}</p>
            <p className="[text-wrap:pretty]">{wk.goal.mine > 0 ? `You have added ${wk.goal.mine.toLocaleString()} so far.` : "You haven't added to it yet. Anything you learn this week counts."}</p>
            <p className="text-sm text-muted-foreground [text-wrap:pretty]">{wk.goal.completed ? "Everyone who helped earned a Double XP token." : "When the community reaches it, everyone who helped earns a Double XP token."} A new goal starts every Monday.</p>
          </div>
        )}
      </div>
    </BottomSheet>
  </section>;
}
