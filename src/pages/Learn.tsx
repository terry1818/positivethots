import { GuideArt } from "@/components/mascot/GuideArt";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useTutorialState } from "@/hooks/useTutorialState";
import { SpotlightTour, type TourStep } from "@/components/SpotlightTour";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/stores/sessionStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/BottomNav";

import { XPBar } from "@/components/education/XPBar";
import { DailyRewardModal } from "@/components/rewards/DailyRewardModal";
import { StreakBadge } from "@/components/education/StreakBadge";
import { NearMissCard } from "@/components/education/NearMissCard";
import { StreakInterstitial } from "@/components/education/StreakInterstitial";

import { PageSkeleton } from "@/components/PageSkeleton";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { useLearningStats, getLevelName, calculateLevel } from "@/hooks/useLearningStats";
import { StreakRestoreModal } from "@/components/education/StreakRestoreModal";
import { useFeatureUnlocks } from "@/hooks/useFeatureUnlocks";
import { useSubscription } from "@/hooks/useSubscription";
import { BadgePathMap } from "@/components/education/TierRoadmap";
import { BookOpen, CheckCircle, Award, Users, Star, BookMarked, NotebookPen, MapPin, HeartPulse, Megaphone, Search, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/SearchInput";
import { BrandedEmptyState } from "@/components/BrandedEmptyState";
import { LearnHeader } from "@/components/education/LearnHeader";
import { LearnTabs } from "@/components/education/LearnTabs";
import { LearnToday } from "@/components/education/LearnToday";
import { LearnContinueBar } from "@/components/education/LearnContinueBar";
import { nextLearningTarget } from "@/lib/learnHome";
import { useTotalBadgeCount } from "@/hooks/useTotalBadgeCount";
import type { PathScenario } from "@/lib/mixedNodes";
import type { LessonSection } from "@/lib/learnLevels";
import { reportError } from "@/lib/errorReporting";
import { lessonTitle } from "@/lib/lessonText";

interface Module {
  id: string; slug: string; title: string; description: string; order_index: number;
  is_required: boolean; tier: string | null; badge_number: number | null;
  estimated_minutes: number | null; prerequisite_badges: string[] | null; is_optional: boolean | null;
}

interface UserBadge { module_id: string; earned_at: string; }

const tierOrder = ["foundation", "sexual_health", "identity", "relationships", "advanced"];

const Learn = () => {
  const [moduleSearchQuery, setModuleSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [dailyBonusReady, setDailyBonusReady] = useState(false);
  const [dailyBonusTrigger, setDailyBonusTrigger] = useState(0);
  const [modules, setModules] = useState<Module[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [scenarios,setScenarios] = useState<PathScenario[]>([]);
  const [optionalDone,setOptionalDone] = useState<Record<string,Set<string>>>({});
  const [questionModules,setQuestionModules] = useState<Set<string>>(new Set());
  const [pathSections, setPathSections] = useState<LessonSection[]>([]);
  const [completedSectionIds, setCompletedSectionIds] = useState<Set<string>>(new Set());
  const [startedSectionIds, setStartedSectionIds] = useState<Set<string>>(new Set());
  const { total: cachedTotal } = useTotalBadgeCount();
  const [moduleProgress, setModuleProgress] = useState<Record<string, { completed: number; total: number }>>({});
  const [continueModuleId, setContinueModuleId] = useState<string | undefined>();
  const [continueSectionNumber, setContinueSectionNumber] = useState<number | undefined>();
  const [hasSpunToday, setHasSpunToday] = useState(true); // default true to prevent flash
  const [showStreakInterstitial, setShowStreakInterstitial] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [justCompleted] = useState<{moduleId: string; node: string; oldXP?: number} | undefined>(() => location.state?.justCompleted);
  const clearedFinish = useRef(false);
  useEffect(() => {
    if (!loading && justCompleted && !clearedFinish.current) {
      clearedFinish.current = true;
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [loading, justCompleted, navigate, location.pathname]);
  const handleModuleSearch = useCallback((q: string) => setModuleSearchQuery(q.toLowerCase()), []);
  const { stats, loading: statsLoading, sectionsToday, isStreakAtRisk, streakHoursLeft, showStreakRestore, brokenStreakCount, restoreStreak, awardXP } = useLearningStats();
  const { tiers, loading: tiersLoading } = useFeatureUnlocks();
  const { tier: subscriptionTier } = useSubscription();
  const { seen: learnTourSeen, markSeen: markLearnTourSeen } = useTutorialState("learn_tour");
  const [showLearnTour, setShowLearnTour] = useState(false);

  const learnTourSteps: TourStep[] = [
    { target: "learn-xp-bar", title: "Your Learning Progress", description: "Complete modules to earn XP and level up for rewards!", position: "below" },
    { target: "learn-tier-active", title: "Tier Roadmap", description: "Work through each tier to unlock new features. Complete all modules in a tier to unlock the next one.", position: "below" },
    { target: "learn-daily-challenge", title: "Daily Challenges", description: "Complete daily challenges for bonus XP. Keep your streak alive! 🔥", position: "below" },
  ];

  useEffect(() => { loadData(); }, []);

  // Show learn tour after data loads
  useEffect(() => {
    if (!loading && !learnTourSeen && !showLearnTour && modules.length > 0) {
      const timer = setTimeout(() => setShowLearnTour(true), 600);
      return () => clearTimeout(timer);
    }
  }, [loading, learnTourSeen, modules.length, showLearnTour]);

  // Show streak interstitial on load if at risk
  useEffect(() => {
    if (!loading && isStreakAtRisk && stats && stats.current_streak >= 3 && streakHoursLeft <= 8) {
      if (!useSessionStore.getState().isBannerDismissed("streak_interstitial")) {
        setTimeout(() => setShowStreakInterstitial(true), 1000);
      }
    }
  }, [loading, isStreakAtRisk, stats, streakHoursLeft]);

  // nearMissTier computed below after earnedModuleIds

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const [modulesResult, badgesResult, sectionsResult, progressResult, scenariosResult, storyProgress, rewardsResult, xpResult, countsResult, optionalPrefs] = await Promise.all([
        supabase.from("education_modules").select("*").order("order_index"),
        supabase.from("user_badges").select("module_id, earned_at").eq("user_id", session.user.id),
        supabase.from("module_sections").select("id, module_id, section_number, title").order("section_number"),
        supabase.from("user_section_progress").select("section_id, completed").eq("user_id", session.user.id),
        supabase.from("education_scenarios").select("id,module_id,scenario_slug,title").order("scenario_slug"),
        supabase.from("user_scenario_progress").select("scenario_id,completed").eq("user_id",session.user.id),
        supabase.from("user_path_rewards").select("module_id").eq("user_id",session.user.id),
        supabase.from("xp_transactions").select("source,source_id").eq("user_id",session.user.id).in("source",["practice","listen"]),
        supabase.rpc("get_module_counts"),
        supabase.from("user_preferences").select("key,value").eq("user_id",session.user.id).like("key","learn_optional:%"),
      ]);
      if (modulesResult.error) throw modulesResult.error;
      if (badgesResult.error) throw badgesResult.error;
      if (sectionsResult.error) throw sectionsResult.error;
      if (progressResult.error) throw progressResult.error;
      if(scenariosResult.error || storyProgress.error || rewardsResult.error || xpResult.error || countsResult.error) throw scenariosResult.error || storyProgress.error || rewardsResult.error || xpResult.error || countsResult.error;
      const stories=scenariosResult.data||[];setScenarios(stories);
      const optional:Record<string,Set<string>>={}; const done=(mid:string,node:string)=>{(optional[mid] ||= new Set()).add(node);};
      for(const p of storyProgress.data||[]){const story=stories.find(s=>s.id===p.scenario_id);if(p.completed&&story)done(story.module_id,`story:${story.id}`);}
      for(const r of rewardsResult.data||[])done(r.module_id,"chest");
      const practiceDay=new Date().toISOString().slice(0,10);
      for(const x of xpResult.data||[]){if(x.source==="listen"&&x.source_id)done(x.source_id,"listen");if(x.source==="practice"&&x.source_id?.endsWith(`:${practiceDay}`))done(x.source_id.slice(0,-11),"practice");}
      for(const p of optionalPrefs.data||[]){if(p.value!==true)continue;const [_,kind,id,date]=p.key.split(":");if(kind==="listen" || kind==="practice"&&date===practiceDay)done(id,kind);}
      setOptionalDone(optional);setQuestionModules(new Set((countsResult.data||[]).filter(c=>Number(c.question_count)+Number(c.checkpoint_count)>0).map(c=>c.module_id)));
      setContinueModuleId(undefined);
      setContinueSectionNumber(undefined);

      const mods = modulesResult.data || [];
      const badges = badgesResult.data || [];
      const sections = (sectionsResult.data || []).map(s => ({ ...s, title: lessonTitle(s.id, s.title) }));
      const completedProgress = (progressResult.data || []).filter(p => p.completed);
      setPathSections(sections);
      setStartedSectionIds(new Set((progressResult.data || []).map(p => p.section_id)));

      setModules(mods);
      setUserBadges(badges);

      // Build module progress map
      const completedSectionIds = new Set(completedProgress.map(p => p.section_id));
      setCompletedSectionIds(completedSectionIds);
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

            // Find first incomplete section in this module
            const moduleSections = sections.filter(s => s.module_id === sectionData.module_id);
            const firstIncompleteSection = moduleSections.find(s => !completedSectionIds.has(s.id));

            setContinueModuleId(sectionData.module_id);
            setContinueSectionNumber(
              firstIncompleteSection
                ? firstIncompleteSection.section_number || sectionData.section_number
                : sectionData.section_number
            );
          }
        }
      }

      // Check daily spin status
      const { data: profileData } = await supabase
        .from("profiles")
        .select("last_daily_spin")
        .eq("id", session.user.id)
        .single();
      const today = new Date().toISOString().split("T")[0];
      setHasSpunToday((profileData as any)?.last_daily_spin === today);

      // Show streak interstitial if at risk and haven't done activity today
      // (delay slightly to avoid competing with page load)
    } catch (error: any) {
      console.error("Error loading education data:", error);
      void reportError(error instanceof Error ? error : new Error("Failed to load learning path"));
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const earnedModuleIds = useMemo(() => new Set(userBadges.map(b => b.module_id)), [userBadges]);
  const earnedSlugs = useMemo(() => new Set(modules.filter(m => earnedModuleIds.has(m.id)).map(m => m.slug)), [modules, earnedModuleIds]);
  const totalBadges = cachedTotal;
  const earnedCount = userBadges.length;
  const requiredModules = useMemo(() => modules.filter(m => m.is_required), [modules]);
  const requiredEarned = useMemo(() => requiredModules.filter(m => earnedModuleIds.has(m.id)).length, [requiredModules, earnedModuleIds]);

  // Near-miss tier computation
  const nearMissTier = useMemo(() => {
    if (!tiers.length || !modules.length) return null;
    for (const tier of tiers) {
      const tierModules = modules.filter(m => m.tier === tier.tier);
      const earnedInTier = tierModules.filter(m => earnedModuleIds.has(m.id)).length;
      const remaining = tierModules.length - earnedInTier;
      if (remaining > 0 && remaining <= 2) {
        const firstLockedFeature = tier.features.find(f => !f.isUnlocked);
        if (firstLockedFeature) {
          return { badgesRemaining: remaining, featureLabel: firstLockedFeature.label, tierName: tier.tier.replace("_", " ") };
        }
      }
    }
    return null;
  }, [tiers, modules, earnedModuleIds]);

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

  const nextTarget = nextLearningTarget(modules, earnedModuleIds, isModuleUnlocked, moduleProgress, userBadges, continueModuleId, continueSectionNumber);
  const openNextLesson = () => {
    if (!nextTarget) return;
    const lessons = pathSections.filter(s => s.module_id === nextTarget.module.id);
    const next = lessons.find(s => !completedSectionIds.has(s.id));
    navigate(`/learn/${nextTarget.module.slug}${nextTarget.review ? "?section=1" : next ? `?section=${next.section_number}` : "?quiz=1"}`);
  };

  if (loading) {
    return <PageSkeleton variant="learn" />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-20">
        <header className="border-b border-border bg-card">
          <div className="container max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-2.5">
            <Logo size="md" showText={false} />
          </div>
        </header>
        <main className="flex-1 container max-w-md mx-auto px-4 py-6 flex items-center justify-center">
          <BrandedEmptyState
            illustration={<GuideArt name="guide-encourage" size={160}/>} mascot="confused"
            headline="We couldn't load your path."
            description="Something went wrong on our end. Give it another try!"
            ctaLabel="Try again"
            onCtaClick={() => { setError(false); setLoading(true); loadData(); }}
          />
        </main>
        <BottomNav />
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-20">
        <header className="border-b border-border bg-card">
          <div className="container max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-2.5">
            <Logo size="md" showText={false} />
          </div>
        </header>
        <main className="flex-1 container max-w-md mx-auto px-4 py-6 flex items-center justify-center">
          <BrandedEmptyState
            illustration={<GuideArt name="guide-waving" size={160}/>} mascot="confused"
            headline="New lessons are on the way."
            description="We're working on adding new learning content. Check back soon!"
          />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-[calc(176px+env(safe-area-inset-bottom))]">
      <SEO
        title="Learn — Relationship Education Modules | Positive Thots"
        description="Badge-based curriculum on consent, communication, and relationship structures. Complete modules to unlock matchmaking."
        path="/learn"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: "Positive Thots Relationship Education",
          description: "Structured curriculum covering consent, communication, and ethical non-monogamy.",
          provider: {
            "@type": "Organization",
            name: "Positive Thots",
            sameAs: "https://positivethots.app",
          },
        }}
      />
      <h1 className="sr-only">Relationship Education</h1>
      <DailyRewardModal reopenTrigger={dailyBonusTrigger} onReadyChange={setDailyBonusReady} />
      <LearnHeader stats={stats} earned={earnedCount} total={totalBadges} initialXP={justCompleted?.oldXP} searchOpen={showSearch} onSearch={() => setShowSearch(s => !s)}/>
      <LearnTabs/>


      <main className="flex-1 container max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-3 space-y-2">
        {/* Collapsible search */}
        {showSearch && (
          <div className="animate-fade-in">
            <SearchInput placeholder="Search modules..." ariaLabel="Search modules" onSearch={handleModuleSearch} />
          </div>
        )}

        <LearnToday
          streak={stats?.current_streak || 0} lastActivityDate={stats?.last_activity_date || null}
          freezes={stats?.streak_freezes || 0} atRisk={isStreakAtRisk} hoursLeft={streakHoursLeft}
          hasSpunToday={hasSpunToday} bonusReady={dailyBonusReady} openBonus={() => setDailyBonusTrigger(n => n + 1)}
          onReward={async reward => {
            setHasSpunToday(true);
            if (reward.type === "xp" && awardXP) {
              const result = await awardXP(reward.value, "daily_spin");
              if (result.newXP === 0) return false;
              toast.success(`You won ${reward.emoji} +${result.newXP} XP! 🎉`);
            } else {
              toast.success(`You won ${reward.emoji} ${reward.label}! 🎉`);
            }
            return true;
          }}
        />

        <div className="mx-auto w-full max-w-[480px]">
          {totalBadges !== null && totalBadges > 0 && earnedCount >= totalBadges && <GuideArt name="guide-celebrate-all" size={360} className="guide-full-width"/>}
          <BadgePathMap
            modulesByTier={modulesByTier} earnedModuleIds={earnedModuleIds}
            isModuleUnlocked={isModuleUnlocked} isAdvancedPremiumLocked={isAdvancedPremiumLocked}
            isPremium={isPremium} moduleProgress={moduleProgress}
            sections={pathSections} completedSectionIds={completedSectionIds} startedSectionIds={startedSectionIds}
            onModuleClick={slug => navigate(`/learn/${slug}`)} tierFeatures={tiers}
            currentModuleId={nextTarget?.review ? undefined : nextTarget?.module.id}
            currentStarted={nextTarget?.started || false} justCompleted={justCompleted}
            scenarios={scenarios} optionalDone={optionalDone} questionModules={questionModules}
            onChestClaim={id=>{setOptionalDone(prev=>({...prev,[id]:new Set([...(prev[id]||[]),"chest"])}));void loadData();}}
          />
        </div>

        {nearMissTier && <NearMissCard badgesRemaining={nearMissTier.badgesRemaining}
          featureLabel={nearMissTier.featureLabel} tierName={nearMissTier.tierName} onContinue={openNextLesson} />}

        <StreakRestoreModal open={showStreakRestore} streakCount={brokenStreakCount}
          currentXP={stats?.total_xp || 0} onRestore={restoreStreak} onDismiss={() => {}} />

        {/* VIP Upsell for curriculum completion */}
        {totalBadges !== undefined && totalBadges > 0 && earnedCount >= totalBadges && subscriptionTier !== "vip" && (
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

      {nextTarget && <LearnContinueBar title={nextTarget.module.title} percent={nextTarget.percent}
        section={nextTarget.section} totalSections={nextTarget.totalSections}
        started={nextTarget.started} review={nextTarget.review} onContinue={openNextLesson} />}
      <BottomNav />
      {showLearnTour && (
        <SpotlightTour
          tourKey="learn_tour"
          steps={learnTourSteps}
          onComplete={() => { setShowLearnTour(false); markLearnTourSeen(); }}
        />
      )}
      {showStreakInterstitial && stats && (
        <StreakInterstitial
          streak={stats.current_streak}
          hoursLeft={streakHoursLeft}
          onSaveStreak={() => {
            setShowStreakInterstitial(false);
            useSessionStore.getState().dismissBanner("streak_interstitial");
            const currentMod = modules.find(m => !earnedModuleIds.has(m.id));
            if (currentMod) navigate(`/learn/${currentMod.slug}`);
          }}
          onDismiss={() => {
            setShowStreakInterstitial(false);
            useSessionStore.getState().dismissBanner("streak_interstitial");
          }}
        />
      )}
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
