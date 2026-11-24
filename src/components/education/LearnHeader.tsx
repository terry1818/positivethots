import { Logo } from "@/components/Logo";
import { StreakBadge } from "./StreakBadge";
import { XPBar } from "./XPBar";
import { Award, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { calculateLevel, type LearningStats } from "@/hooks/useLearningStats";

export function LearnHeader({ stats, earned, total, initialXP, searchOpen, onSearch }: { stats: LearningStats | null; earned: number; total?: number; initialXP?: number; searchOpen?: boolean; onSearch?: () => void }) {
  return <header className="sticky top-0 z-30 border-b border-border bg-card"><div className="container max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-2.5">
    <div className="flex items-center justify-between mb-1.5"><Logo size="md" showText={false}/><div className="flex items-center justify-end gap-2 flex-wrap"><StreakBadge streak={stats?.current_streak || 0} showFreeze freezeCount={stats?.streak_freezes || 0} freezeAvailable={stats?.streak_freeze_available}/>{(stats?.xp_doublers ?? 0) > 0 && <span className="kit-chip" title="Won on the daily spin: your next lesson pays double XP">2× XP ready</span>}<div className="flex items-center gap-1 bg-muted/50 rounded-full px-2 py-0.5"><Award className="h-3.5 w-3.5 text-primary"/><span className="text-sm font-medium"><AnimatedCounter end={earned}/>/{total ?? "—"}</span></div>{onSearch && <Button variant="ghost" size="icon" onClick={onSearch} className="min-h-11 min-w-11 rounded-full" aria-label={searchOpen ? "Close search" : "Search modules"}>{searchOpen ? <X className="text-muted-foreground"/> : <Search className="text-muted-foreground"/>}</Button>}</div></div>
    {stats && <div data-tour="learn-xp-bar"><XPBar totalXP={stats.total_xp} level={calculateLevel(stats.total_xp)} initialXP={initialXP}/></div>}
  </div></header>;
}