import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/BottomNav";

import { XPBar } from "@/components/education/XPBar";
import { StreakBadge } from "@/components/education/StreakBadge";
import { StreakCalendar } from "@/components/education/StreakCalendar";
import { DailyChallenge } from "@/components/education/DailyChallenge";

import { PageSkeleton } from "@/components/PageSkeleton";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { useLearningStats, getLevelName } from "@/hooks/useLearningStats";
import { StreakRestoreModal } from "@/components/education/StreakRestoreModal";
import { useFeatureUnlocks } from "@/hooks/useFeatureUnlocks";
import { useSubscription } from "@/hooks/useSubscription";
import { BadgePathMap } from "@/components/education/TierRoadmap";
import { BookOpen, CheckCircle, Award, Users, Star, BookMarked, NotebookPen, MapPin, HeartPulse, Megaphone } from "lucide-react";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/SearchInput";

interface Module {
  id: string; slug: string; title: string; description: string; order_index: number;
  is_required: boolean; tier: string | null; badge_number: number | null;
  estimated_minutes: number | null; prerequisite_badges: string[] | null; is_optional: boolean | null;
}

interface UserBadge { module_id: string; earned_at: string; }

const tierOrder = ["foundation", "sexual_health", "identity", "relationships", "advanced"];

const Learn = () => {
  const [moduleSearchQuery, setModuleSearchQuery] = useState("");
  const [modules, setModules] = useState<Module[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [moduleProgress, setModuleProgress] = useState<Record<string, { completed: number; total: number }>>({});
  const [activeLearnerCount, setActiveLearnerCount] = useState<number | null>(null);
  const [continueModuleId, setContinueModuleId] = useState<string | undefined>();
  const [continueSectionNumber, setContinueSectionNumber] = useState<number | undefined>();
  const [continueProgressPercent, setContinueProgressPercent] = useState<number | undefined>();
  const navigate = useNavigate();
  const handleModuleSearch = useCallback((q: string) => setModuleSearchQuery(q.toLowerCase()), []);
  const { stats, loading: statsLoading, sectionsToday, isStreakAtRisk, streakHoursLeft, showStreakRestore, brokenStreakCount, restoreStreak } = useLearningStats();
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

      // Fetch continue data
      const { data: recentProgress } = await supabase
        .from("user_section_progress")
        .select("section_id, completed, last_accessed")
        .eq("user_id", session.user.id)
        .order("last_accessed", { ascending: false })
        .limit(1);

      if (recentProgress && recentProgress.length > 0) {
        const { data: sectionData } = await supabase
          .from("module_sections")
          .select("module_id, section_number")
          .eq("id", recentProgress[0].section_id)
          .single();

        if (sectionData) {
          const earnedIds = new Set(badges.map(b => b.module_id));
          if (!earnedIds.has(sectionData.module_id)) {
            const mp = progressMap[sectionData.module_id];
            const pct = mp && mp.total > 0 ? Math.round((mp.completed / mp.total) * 100) : 0;
            setContinueModuleId(sectionData.module_id);
            setContinueSectionNumber(sectionData.section_number);
            setContinueProgressPercent(Math.min(pct, 90));
          }
        }
      }

      // Fetch real active learner count
      const last24h = new Date(Date.now() - 86400000).toISOString();
      const { count: learnerCount } = await supabase
        .from("analytics_events")
        .select("user_id", { count: "exact", head: true })
        .eq("event_name", "module_section_viewed")
        .gte("created_at", last24h);
      setActiveLearnerCount(learnerCount && learnerCount > 0 ? learnerCount : null);
    } catch (error: any) {
      console.error("Error loading education data:", error);
      toast.error("Failed to load education modules");
    } finally {
      setLoading(false);
    }
  };

  const earnedModuleIds = useMemo(() => new Set(userBadges.map(b => b.module_id)), [userBadges]);
  const earnedSlugs = useMemo(() => new Set(modules.filter(m => earnedModuleIds.has(m.id)).map(m => m.slug)), [modules, earnedModuleIds]);
  const totalBadges = modules.length;
  const earnedCount = userBadges.length;
  const requiredModules = useMemo(() => modules.filter(m => m.is_required), [modules]);
  const requiredEarned = useMemo(() => requiredModules.filter(m => earnedModuleIds.has(m.id)).length, [requiredModules, earnedModuleIds]);
  const progressPercent = totalBadges > 0 ? (earnedCount / totalBadges) * 100 : 0;

  const isPremium = subscriptionTier !== "free";

  const isModuleUnlocked = useCallback((module: Module) => {
    if (module.tier === 'foundation') {
      const foundationModules = modules.filter(m => m.tier === 'foundation').sort((a, b) => a.order_index - b.order_index);
      const idx = foundationModules.findIndex(m => m.id === module.id);
      return idx === 0 || earnedModuleIds.has(foundationModules[idx - 1]?.id);
    }
    if (requiredEarned < requiredModules.length) return false;
    if (module.tier === 'advanced' && !isPremium) return false;
    if (!module.prerequisite_badges || module.prerequisite_badges.length === 0) return true;
    return module.prerequisite_badges.every(slug => earnedSlugs.has(slug));
  }, [modules, earnedModuleIds, earnedSlugs, requiredEarned, requiredModules, isPremium]);

  const isAdvancedPremiumLocked = useCallback((module: Module) => {
    if (module.tier !== 'advanced' || isPremium) return false;
    if (requiredEarned < requiredModules.length) return false;
    if (module.prerequisite_badges && module.prerequisite_badges.length > 0) {
      return module.prerequisite_badges.every(slug => earnedSlugs.has(slug));
    }
    return true;
  }, [isPremium, requiredEarned, requiredModules, earnedSlugs]);

  const modulesByTier = useMemo(() => {
    const filtered = moduleSearchQuery
      ? modules.filter(m => m.title.toLowerCase().includes(moduleSearchQuery) || m.description.toLowerCase().includes(moduleSearchQuery))
      : modules;
    return tierOrder.reduce((acc, tier) => {
      acc[tier] = filtered.filter(m => m.tier === tier).sort((a, b) => a.order_index - b.order_index);
      return acc;
    }, {} as Record<string, Module[]>);
  }, [modules, moduleSearchQuery]);

  if (loading) {
    return <PageSkeleton variant="learn" />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <header className="border-b border-border bg-card">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" showText={false} />
            <div className="flex items-center gap-3">
              <StreakBadge
                streak={stats?.current_streak || 0}
                showFreeze
                freezeCount={stats?.streak_freezes || 0}
                freezeAvailable={stats?.streak_freeze_available}
                atRisk={isStreakAtRisk}
                hoursLeft={streakHoursLeft}
              />
              {isStreakAtRisk && stats && stats.current_streak > 0 && (
                <span className="bg-destructive/15 border border-destructive/40 text-destructive text-sm font-bold rounded-full px-2 py-0.5">
                  🔥 {streakHoursLeft}h left
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium"><AnimatedCounter end={earnedCount} />/{totalBadges}</span>
              </div>
            </div>
          </div>
          {/* Compact XP row */}
          {stats && (
            <div className="mt-3">
              <XPBar totalXP={stats.total_xp} level={stats.current_level} />
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 container max-w-md mx-auto px-4 py-4 space-y-3">
        <SearchInput placeholder="Search modules..." ariaLabel="Search modules" onSearch={handleModuleSearch} />

        {/* Streak Calendar + Daily Challenge combined card */}
        {stats && (
          <Card className="animate-fade-in">
            <CardContent className="p-3 space-y-2">
              <StreakCalendar streak={stats.current_streak} lastActivityDate={stats.last_activity_date} freezeCount={stats.streak_freezes} />
              <DailyChallenge />
            </CardContent>
          </Card>
        )}

        {/* Streak Restore Modal */}
        <StreakRestoreModal
          open={showStreakRestore}
          streakCount={brokenStreakCount}
          currentXP={stats?.total_xp || 0}
          onRestore={restoreStreak}
          onDismiss={() => {}}
        />

        {/* Active learners — subtle line */}
        {activeLearnerCount != null && activeLearnerCount > 0 && (
          <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {activeLearnerCount.toLocaleString()} learners active today
          </p>
        )}

        {/* Learning Path — compact header */}
        <div className="animate-fade-in space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Learning Path
              <span className="text-sm text-muted-foreground font-normal">
                · <AnimatedCounter end={earnedCount} />/{totalBadges} badges
              </span>
            </h2>
          </div>
          <div className="relative overflow-hidden rounded-full h-2 bg-muted">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <BadgePathMap
            modulesByTier={modulesByTier}
            earnedModuleIds={earnedModuleIds}
            isModuleUnlocked={isModuleUnlocked}
            isAdvancedPremiumLocked={isAdvancedPremiumLocked}
            isPremium={isPremium}
            moduleProgress={moduleProgress}
            onModuleClick={(slug) => navigate(`/learn/${slug}`)}
            tierFeatures={tiers}
            isStreakAtRisk={isStreakAtRisk}
            streakHoursLeft={streakHoursLeft}
            continueModuleId={continueModuleId}
            continueSectionNumber={continueSectionNumber}
            continueProgressPercent={continueProgressPercent}
          />
        </div>

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
                  <p className="text-sm text-muted-foreground mt-1">
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

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Resources & Tools — 2-column grid */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-primary" />
            Resources & Tools
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: BookMarked, label: "Books & Products", onClick: () => navigate("/resources") },
              { icon: NotebookPen, label: "Reflection Journal", onClick: () => navigate("/journal") },
              { icon: MapPin, label: "Find Testing", onClick: () => navigate("/testing-locations") },
              { icon: HeartPulse, label: "Test From Home", onClick: () => navigate("/health-testing") },
            ].map(({ icon: Icon, label, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="flex flex-col items-center justify-center gap-1.5 p-3 min-h-[72px] rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-center"
              >
                <Icon className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate("/resources?tab=advocacy")}
            className="flex items-center justify-center gap-2 w-full p-3 min-h-[48px] rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
          >
            <Megaphone className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Advocacy & Action</span>
          </button>
        </section>

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
                <Badge variant="secondary" className="text-sm">
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
