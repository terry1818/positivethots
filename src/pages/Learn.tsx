import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BottomNav } from "@/components/BottomNav";
import { EducationBadge } from "@/components/EducationBadge";
import { XPBar } from "@/components/education/XPBar";
import { StreakBadge } from "@/components/education/StreakBadge";
import { useLearningStats, getLevelName } from "@/hooks/useLearningStats";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BookOpen, CheckCircle, Lock, ChevronRight, ChevronDown, Award } from "lucide-react";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

interface UserBadge {
  module_id: string;
  earned_at: string;
}

const tierConfig: Record<string, { label: string; color: string; bgClass: string }> = {
  foundation: { label: "Foundation (Required)", color: "text-primary", bgClass: "from-primary/10 to-primary/5" },
  sexual_health: { label: "Sexual Health", color: "text-success", bgClass: "from-success/10 to-success/5" },
  identity: { label: "Identity & Diversity", color: "text-[hsl(285_55%_45%)]", bgClass: "from-[hsl(285_55%_45%)]/10 to-[hsl(285_55%_45%)]/5" },
  relationships: { label: "Healthy Relationships", color: "text-[hsl(340_65%_55%)]", bgClass: "from-[hsl(340_65%_55%)]/10 to-[hsl(340_65%_55%)]/5" },
  advanced: { label: "Advanced Topics", color: "text-accent", bgClass: "from-accent/10 to-accent/5" },
};

const tierOrder = ["foundation", "sexual_health", "identity", "relationships", "advanced"];

const Learn = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTiers, setOpenTiers] = useState<Record<string, boolean>>({ foundation: true });
  const navigate = useNavigate();
  const { stats, loading: statsLoading } = useLearningStats();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const [modulesResult, badgesResult] = await Promise.all([
        supabase.from("education_modules").select("*").order("order_index"),
        supabase.from("user_badges").select("module_id, earned_at").eq("user_id", session.user.id)
      ]);

      if (modulesResult.error) throw modulesResult.error;
      if (badgesResult.error) throw badgesResult.error;

      setModules(modulesResult.data || []);
      setUserBadges(badgesResult.data || []);
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

  const toggleTier = (tier: string) => {
    setOpenTiers(prev => ({ ...prev, [tier]: !prev[tier] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="sm" showText={false} />
            <div className="flex items-center gap-3">
              <StreakBadge streak={stats?.current_streak || 0} />
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{earnedCount}/{totalBadges}</span>
              </div>
            </div>
          </div>
          {/* XP Bar */}
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

      {/* Content */}
      <main className="flex-1 container max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Progress Section */}
        <Card className="bg-gradient-to-br from-secondary/10 to-primary/10 border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Your Progress</span>
              <span className="text-sm text-muted-foreground">{earnedCount}/{totalBadges} badges</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            {requiredEarned === requiredModules.length && requiredModules.length > 0 ? (
              <p className="text-sm text-success mt-2 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Discovery unlocked! Keep learning for more badges.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">
                Complete {requiredModules.length - requiredEarned} more foundation module{requiredModules.length - requiredEarned !== 1 ? 's' : ''} to unlock discovery
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tiered Modules */}
        <div className="space-y-3">
          {tierOrder.map(tier => {
            const tierModules = modulesByTier[tier];
            if (!tierModules || tierModules.length === 0) return null;
            const config = tierConfig[tier];
            const tierCompleted = tierModules.filter(m => earnedModuleIds.has(m.id)).length;
            const isOpen = openTiers[tier] ?? false;

            return (
              <Collapsible key={tier} open={isOpen} onOpenChange={() => toggleTier(tier)}>
                <CollapsibleTrigger asChild>
                  <button className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg bg-gradient-to-r border-0 transition-all",
                    config.bgClass
                  )}>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-semibold text-sm", config.color)}>{config.label}</span>
                      <span className="text-xs text-muted-foreground">{tierCompleted}/{tierModules.length}</span>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  {tierModules.map((module) => {
                    const isCompleted = earnedModuleIds.has(module.id);
                    const isUnlocked = isModuleUnlocked(module);

                    return (
                      <Card
                        key={module.id}
                        className={cn("cursor-pointer transition-all", isUnlocked ? "hover:shadow-md" : "opacity-60 cursor-not-allowed")}
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
                            {module.estimated_minutes && (
                              <span className="text-xs text-muted-foreground">~{module.estimated_minutes} min</span>
                            )}
                          </div>
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-success shrink-0" />
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

        {/* Info Section */}
        <Card className="bg-muted/50 border-0">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">Why Education First?</h3>
            <p className="text-sm text-muted-foreground">
              At Positive Thots, we believe informed connections are better connections. 
              Complete the 5 foundation modules to unlock discovery, then continue learning 
              with 15 additional courses on sexual health, identity, relationships, and more.
            </p>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default Learn;
