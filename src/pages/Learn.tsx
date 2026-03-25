import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/BottomNav";
import { EducationBadge } from "@/components/EducationBadge";
import { XPBar } from "@/components/education/XPBar";
import { StreakBadge } from "@/components/education/StreakBadge";
import { StreakCalendar } from "@/components/education/StreakCalendar";
import { DailyChallenge } from "@/components/education/DailyChallenge";
import { ContinueLearning } from "@/components/education/ContinueLearning";

import { PageSkeleton } from "@/components/PageSkeleton";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { useLearningStats, getLevelName } from "@/hooks/useLearningStats";
import { useFeatureUnlocks } from "@/hooks/useFeatureUnlocks";
import { useSubscription } from "@/hooks/useSubscription";
import { BadgePathMap } from "@/components/education/TierRoadmap";
import { BookOpen, CheckCircle, ChevronRight, Award, Users, Star } from "lucide-react";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Module {
  id: string; slug: string; title: string; description: string; order_index: number;
  is_required: boolean; tier: string | null; badge_number: number | null;
  estimated_minutes: number | null; prerequisite_badges: string[] | null; is_optional: boolean | null;
}

interface UserBadge { module_id: string; earned_at: string; }

const tierConfig: Record<string, { label: string; color: string; bgClass: string; borderColor: string }> = {
  foundation: { label: "Foundation (Required)", color: "text-primary", bgClass: "from-primary/20 to-primary/10", borderColor: "border-l-primary" },
  sexual_health: { label: "Sexual Health", color: "text-success", bgClass: "from-success/20 to-success/10", borderColor: "border-l-success" },
  identity: { label: "Identity & Diversity", color: "text-[hsl(285_55%_45%)]", bgClass: "from-[hsl(285_55%_45%)]/20 to-[hsl(285_55%_45%)]/10", borderColor: "border-l-[hsl(285_55%_45%)]" },
  relationships: { label: "Healthy Relationships", color: "text-[hsl(340_65%_55%)]", bgClass: "from-[hsl(340_65%_55%)]/20 to-[hsl(340_65%_55%)]/10", borderColor: "border-l-[hsl(340_65%_55%)]" },
  advanced: { label: "Advanced Topics", color: "text-accent", bgClass: "from-accent/20 to-accent/10", borderColor: "border-l-accent" },
};

const tierOrder = ["foundation", "sexual_health", "identity", "relationships", "advanced"];

const Learn = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [moduleProgress, setModuleProgress] = useState<Record<string, { completed: number; total: number }>>({});
  const [activeLearnerCount, setActiveLearnerCount] = useState<number | null>(null);
  const navigate = useNavigate();
  const { stats, loading: statsLoading, sectionsToday, isStreakAtRisk, streakHoursLeft } = useLearningStats();
  const { tiers, loading: tiersLoading } = useFeatureUnlocks();
  const { tier: subscriptionTier } = useSubscription();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const [modulesResult, badgesResult, sectionsResult, progressResult] = await Promise.all([
        supabase.from("education_modules").select("*").order("order_index"),
        supabase.from("user_badges").select("module_id, earned_at").eq("user_id", session.user.id),
        supabase.from("module_sections").select("id, module_id"),
        supabase.from("user_section_progress").select("section_id, completed").eq("user_id", session.user.id).eq("completed", true),
      ]);
      if (modulesResult.error) throw modulesResult.error;
      if (badgesResult.error) throw badgesResult.error;

      const mods = modulesResult.data || [];
      const badges = badgesResult.data || [];
      const sections = sectionsResult.data || [];
      const completedProgress = progressResult.data || [];

      setModules(mods);
      setUserBadges(badges);

      // Build module progress map
      const completedSectionIds = new Set(completedProgress.map(p => p.section_id));
      const progressMap: Record<string, { completed: number; total: number }> = {};
      for (const section of sections) {
        if (!progressMap[section.module_id]) {
          progressMap[section.module_id] = { completed: 0, total: 0 };
        }
        progressMap[section.module_id].total++;
        if (completedSectionIds.has(section.id)) {
          progressMap[section.module_id].completed++;
        }
      }
      setModuleProgress(progressMap);

      // Fetch real active learner count
      const last24h = new Date(Date.now() - 86400000).toISOString();
      const { count: learnerCount } = await supabase
        .from("analytics_events")
        .select("user_id", { count: "exact", head: true })
        .eq("event_name", "module_section_viewed")
        .gte("created_at", last24h);
      setActiveLearnerCount(learnerCount && learnerCount > 0 ? learnerCount : null);

      // No longer need openTiers state
    } catch (error: any) {
      console.error("Error loading education data:", error);
      toast.error("Failed to load education modules");
    } finally {
      setLoading(false);
    }
  };

  const earnedModuleIds = new Set(userBadges.map(b => b.module_id));
  const earnedSlugs = new Set(modules.filter(m => earnedModuleIds.has(m.id)).map(m => m.slug));
  const totalBadges = modules.length;
  const earnedCount = userBadges.length;
  const requiredModules = modules.filter(m => m.is_required);
  const requiredEarned = requiredModules.filter(m => earnedModuleIds.has(m.id)).length;
  const progressPercent = totalBadges > 0 ? (earnedCount / totalBadges) * 100 : 0;

  const isModuleUnlocked = (module: Module) => {
    if (module.tier === 'foundation') {
      const foundationModules = modules.filter(m => m.tier === 'foundation').sort((a, b) => a.order_index - b.order_index);
      const idx = foundationModules.findIndex(m => m.id === module.id);
      return idx === 0 || earnedModuleIds.has(foundationModules[idx - 1]?.id);
    }
    if (requiredEarned < requiredModules.length) return false;
    if (!module.prerequisite_badges || module.prerequisite_badges.length === 0) return true;
    return module.prerequisite_badges.every(slug => earnedSlugs.has(slug));
  };

  const modulesByTier = tierOrder.reduce((acc, tier) => {
    acc[tier] = modules.filter(m => m.tier === tier).sort((a, b) => a.order_index - b.order_index);
    return acc;
  }, {} as Record<string, Module[]>);

  

  if (loading) {
    return <PageSkeleton variant="learn" />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <header className="border-b border-border bg-card">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-3">
              <StreakBadge
                streak={stats?.current_streak || 0}
                showFreeze
                freezeAvailable={stats?.streak_freeze_available}
                atRisk={isStreakAtRisk}
                hoursLeft={streakHoursLeft}
              />
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium"><AnimatedCounter end={earnedCount} />/{totalBadges}</span>
              </div>
            </div>
          </div>
          {stats && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{getLevelName(stats.current_level)}</span>
              </div>
              <XPBar totalXP={stats.total_xp} level={stats.current_level} />
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 container max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Streak at risk warning */}
        {isStreakAtRisk && stats && stats.current_streak > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center gap-3 animate-heartbeat">
            <span className="text-2xl">🔥</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-destructive">Your {stats.current_streak}-day streak is at risk!</p>
              <p className="text-xs text-destructive/70">Complete a section in the next {streakHoursLeft}h to keep it going</p>
            </div>
          </div>
        )}

        {/* Continue Learning hero */}
        <ContinueLearning />

        {/* Streak Calendar */}
        {stats && (
          <StreakCalendar streak={stats.current_streak} lastActivityDate={stats.last_activity_date} />
        )}

        {/* Daily Challenge */}
        <DailyChallenge />

        {/* Community social proof */}
        {activeLearnerCount != null && activeLearnerCount > 0 && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-1">
            <Users className="h-3 w-3" />
            <span>{activeLearnerCount.toLocaleString()} learners active today</span>
          </div>
        )}

        {/* Unified Learning Path */}
        <Card className="animate-fade-in overflow-hidden">
          <CardContent className="pt-5 pb-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Learning Path
              </h2>
              <span className="text-xs text-muted-foreground">
                <AnimatedCounter end={earnedCount} />/{totalBadges} badges
              </span>
            </div>
            <div className="relative overflow-hidden rounded-full h-2 bg-muted">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {requiredEarned === requiredModules.length && requiredModules.length > 0 ? (
              <p className="text-xs text-success flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" />Discovery unlocked! Keep learning for more.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Complete {requiredModules.length - requiredEarned} more foundation module{requiredModules.length - requiredEarned !== 1 ? 's' : ''} to unlock discovery
              </p>
            )}

            <div className="space-y-2">
              {tierOrder.map((tier, tierIdx) => {
                const tierModules = modulesByTier[tier];
                if (!tierModules || tierModules.length === 0) return null;
                const config = tierConfig[tier];
                const tierCompleted = tierModules.filter(m => earnedModuleIds.has(m.id)).length;
                const isOpen = openTiers[tier] ?? false;
                const isTierComplete = tierCompleted === tierModules.length && tierModules.length > 0;
                const tierFeatures = tiers.find(t => t.tier === tier)?.features || [];

                return (
                  <Collapsible key={tier} open={isOpen} onOpenChange={() => toggleTier(tier)}>
                    <CollapsibleTrigger asChild>
                      <button className={cn(
                        "w-full flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r border border-border transition-all animate-stagger-fade",
                        config.bgClass,
                        isTierComplete && "ring-2 ring-success/30"
                      )} style={{ animationDelay: `${tierIdx * 100}ms` }}>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn("font-semibold text-sm", config.color)}>{config.label}</span>
                          <span className="text-xs text-muted-foreground">{tierCompleted}/{tierModules.length}</span>
                          {isTierComplete && <CheckCircle className="h-3.5 w-3.5 text-success" />}
                        </div>
                        {tierFeatures.length > 0 && (
                          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                            {tierFeatures.map(f => (
                              <span
                                key={f.key}
                                className={cn(
                                  "inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full border",
                                  f.isUnlocked
                                    ? `bg-success/10 border-success/30 text-success font-medium`
                                    : "bg-muted/50 border-muted text-muted-foreground"
                                )}
                              >
                                <span>{f.icon}</span>
                                <span className="hidden sm:inline">{f.label}</span>
                                {f.isUnlocked && <CheckCircle className="h-2 w-2" />}
                              </span>
                            ))}
                          </div>
                        )}
                        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", isOpen && "rotate-180")} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 pt-2">
                      {tierModules.map((module, moduleIdx) => {
                        const isCompleted = earnedModuleIds.has(module.id);
                        const isUnlocked = isModuleUnlocked(module);
                        const progress = moduleProgress[module.id];
                        const rawSectionPercent = progress && progress.total > 0
                          ? Math.round((progress.completed / progress.total) * 100)
                          : 0;
                        const sectionPercent = (rawSectionPercent >= 100 && !isCompleted) ? 90 : rawSectionPercent;
                        return (
                          <Card
                            key={module.id}
                            className={cn(
                              "cursor-pointer transition-all border-l-4 animate-stagger-fade",
                              config.borderColor,
                              isUnlocked ? "hover:shadow-md hover:-translate-y-0.5" : "opacity-60 cursor-not-allowed"
                            )}
                            style={{ animationDelay: `${moduleIdx * 60}ms` }}
                            onClick={() => isUnlocked && navigate(`/learn/${module.slug}`)}
                          >
                            <CardContent className="p-3 flex items-center gap-3">
                              <EducationBadge moduleSlug={module.slug} title={module.title} isEarned={isCompleted} tier={module.tier || 'foundation'} size="md" />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                                  <span className="truncate">{module.title}</span>
                                  {!isUnlocked && <Lock className="h-3 w-3 shrink-0" />}
                                </h3>
                                <p className="text-xs text-muted-foreground line-clamp-1">{module.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {module.estimated_minutes && (
                                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                      ~{module.estimated_minutes} min
                                    </span>
                                  )}
                                  {progress && progress.total > 0 && !isCompleted && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {progress.completed >= progress.total
                                        ? "Quiz remaining"
                                        : `${progress.completed}/${progress.total} sections`}
                                    </span>
                                  )}
                                </div>
                                {/* Per-module progress bar */}
                                {progress && progress.total > 0 && (
                                  <div className="mt-1.5 relative overflow-hidden rounded-full h-1 bg-muted">
                                    <div
                                      className={cn(
                                        "h-full rounded-full transition-all duration-700",
                                        isCompleted
                                          ? "bg-success"
                                          : "bg-primary/70"
                                      )}
                                      style={{ width: `${isCompleted ? 100 : sectionPercent}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                              {isCompleted ? (
                                <CheckCircle className="h-5 w-5 text-success shrink-0 animate-bounce-in" />
                              ) : isUnlocked ? (
                                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                              ) : null}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* VIP Upsell for curriculum completion */}
        {earnedCount >= 20 && subscriptionTier !== "vip" && (
          <Card className="animate-fade-in bg-gradient-to-r from-amber-500/10 to-accent/10 border-amber-500/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-amber-500/10 p-2">
                  <Star className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">You've completed the full curriculum! 🎓</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upgrade to VIP to earn your Verified Educator badge and host community events.
                  </p>
                  <Button size="sm" className="mt-3" onClick={() => navigate("/premium")}>
                    Upgrade to VIP
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <LeaderboardCard />
      </main>

      <BottomNav />
    </div>
  );
};

// Leaderboard component
const LeaderboardCard = () => {
  const [leaderboard, setLeaderboard] = useState<Array<{ rank: number; display_name: string; sections_completed: number; user_id: string }>>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setCurrentUserId(session.user.id);

      const { data, error } = await supabase.rpc("get_weekly_leaderboard");
      if (!error && data && data.length >= 3) {
        setLeaderboard(data.map((r: any) => ({
          rank: Number(r.rank),
          display_name: r.display_name,
          sections_completed: Number(r.sections_completed),
          user_id: r.user_id,
        })));
      }
    };
    load();
  }, []);

  if (leaderboard.length < 3) return null;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <Card className="bg-muted/50 border border-border">
      <CardContent className="pt-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Star className="h-4 w-4 text-accent" />
          Top Learners This Week
        </h3>
        <div className="space-y-2">
          {leaderboard.map((entry) => {
            const isMe = entry.user_id === currentUserId;
            return (
              <div
                key={entry.user_id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-colors",
                  isMe ? "bg-primary/10 border border-primary/20" : "bg-background"
                )}
              >
                <span className="text-lg w-6 text-center">{medals[entry.rank - 1] || entry.rank}</span>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  {entry.display_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium truncate", isMe && "text-primary")}>
                    {entry.display_name} {isMe && "(You)"}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {entry.sections_completed} sections
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default Learn;
