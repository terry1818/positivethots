import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/Logo";
import { BottomNav } from "@/components/BottomNav";
import { EducationBadge } from "@/components/EducationBadge";
import { BookOpen, CheckCircle, Lock, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Module {
  id: string;
  slug: string;
  title: string;
  description: string;
  order_index: number;
  is_required: boolean;
}

interface UserBadge {
  module_id: string;
  earned_at: string;
}

const Learn = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
        supabase
          .from("education_modules")
          .select("*")
          .order("order_index"),
        supabase
          .from("user_badges")
          .select("module_id, earned_at")
          .eq("user_id", session.user.id)
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
  const completedCount = userBadges.length;
  const requiredCount = modules.filter(m => m.is_required).length;
  const progressPercent = requiredCount > 0 ? (completedCount / requiredCount) * 100 : 0;

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
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-secondary" />
              <h1 className="text-xl font-bold">Learn</h1>
            </div>
            <div className="flex gap-1">
              {modules.slice(0, 5).map(module => (
                <EducationBadge
                  key={module.id}
                  moduleSlug={module.slug}
                  title={module.title}
                  isEarned={earnedModuleIds.has(module.id)}
                  size="sm"
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Progress Section */}
        <Card className="bg-gradient-to-br from-secondary/10 to-primary/10 border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Your Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedCount}/{requiredCount} badges
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            {completedCount === requiredCount && requiredCount > 0 ? (
              <p className="text-sm text-success mt-2 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                All required modules completed!
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">
                Complete all modules to unlock full discovery features
              </p>
            )}
          </CardContent>
        </Card>

        {/* Modules List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Education Modules</h2>
          {modules.map((module, index) => {
            const isCompleted = earnedModuleIds.has(module.id);
            const previousCompleted = index === 0 || earnedModuleIds.has(modules[index - 1]?.id);
            const isUnlocked = previousCompleted;

            return (
              <Card
                key={module.id}
                className={`cursor-pointer transition-all ${
                  isUnlocked 
                    ? "hover:shadow-md" 
                    : "opacity-60 cursor-not-allowed"
                }`}
                onClick={() => isUnlocked && navigate(`/learn/${module.slug}`)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <EducationBadge
                    moduleSlug={module.slug}
                    title={module.title}
                    isEarned={isCompleted}
                    size="md"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold flex items-center gap-2">
                      {module.title}
                      {!isUnlocked && <Lock className="h-3 w-3" />}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {module.description}
                    </p>
                  </div>
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : isUnlocked ? (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Section */}
        <Card className="bg-muted/50 border-0">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">Why Education First?</h3>
            <p className="text-sm text-muted-foreground">
              At Positive Thots, we believe informed connections are better connections. 
              Completing these modules helps create a community where everyone understands 
              consent, boundaries, and healthy ENM practices.
            </p>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default Learn;