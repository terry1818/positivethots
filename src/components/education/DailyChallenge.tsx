import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, Clock, CheckCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const CHALLENGE_TYPES = [
  { type: "sections", label: "Complete {target} sections today", targets: [1, 2, 3] },
  { type: "xp", label: "Earn {target} XP today", targets: [30, 50, 75] },
  { type: "quiz_correct", label: "Get {target} quiz answers right", targets: [3, 5, 8] },
];

interface DailyChallengeData {
  id: string;
  challenge_type: string;
  target_value: number;
  current_progress: number;
  completed: boolean;
  xp_reward: number;
}

export const DailyChallenge = () => {
  const [challenge, setChallenge] = useState<DailyChallengeData | null>(null);
  const [hoursLeft, setHoursLeft] = useState(0);

  useEffect(() => {
    loadOrCreateChallenge();
    const timer = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      setHoursLeft(Math.max(0, Math.floor((endOfDay.getTime() - now.getTime()) / 3600000)));
    }, 60000);
    // Set initial
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    setHoursLeft(Math.max(0, Math.floor((endOfDay.getTime() - now.getTime()) / 3600000)));
    return () => clearInterval(timer);
  }, []);

  const loadOrCreateChallenge = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const today = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("daily_challenges")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("challenge_date", today)
      .maybeSingle();

    if (data) {
      setChallenge(data as DailyChallengeData);
    } else {
      // Personalized challenge type selection
      const selectedType = await selectChallengeType(session.user.id);
      const template = CHALLENGE_TYPES.find(t => t.type === selectedType) || CHALLENGE_TYPES[0];
      const target = template.targets[Math.floor(Math.random() * template.targets.length)];
      const xpReward = 15 + Math.floor(Math.random() * 16); // 15-30 (variable ratio)

      const newChallenge = {
        user_id: session.user.id,
        challenge_type: template.type,
        target_value: target,
        current_progress: 0,
        completed: false,
        xp_reward: xpReward,
        challenge_date: today,
      };

      const { data: inserted } = await supabase
        .from("daily_challenges")
        .insert(newChallenge)
        .select()
        .single();

      if (inserted) setChallenge(inserted as DailyChallengeData);
    }
  };

  const selectChallengeType = async (userId: string): Promise<string> => {
    try {
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();

      const [statsResult, progressResult, badgesResult] = await Promise.all([
        supabase.from("user_learning_stats").select("total_xp, current_streak, last_activity_date").eq("user_id", userId).maybeSingle(),
        supabase.from("user_section_progress").select("section_id, completed").eq("user_id", userId).gte("last_accessed", threeDaysAgo),
        supabase.from("user_badges").select("id").eq("user_id", userId),
      ]);

      const stats = statsResult.data;
      const recentProgress = progressResult.data || [];
      const badgeCount = badgesResult.data?.length || 0;

      // Inactive learner: no sections completed in last 3 days
      const recentCompleted = recentProgress.filter(p => p.completed).length;
      if (recentCompleted === 0) {
        return "sections"; // Low barrier to re-engagement
      }

      // Low XP per badge ratio: user may be rushing
      if (stats && badgeCount > 0 && (stats.total_xp / badgeCount) < 50) {
        return "xp";
      }

      // Active streak: push harder with quiz challenges
      if (stats && stats.current_streak >= 3) {
        return "quiz_correct";
      }

      // Default: random
      return CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)].type;
    } catch {
      // Fallback to random on any error
      return CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)].type;
    }
  };

  if (!challenge) return null;

  const progressPercent = Math.min(100, (challenge.current_progress / challenge.target_value) * 100);
  const template = CHALLENGE_TYPES.find(t => t.type === challenge.challenge_type);
  const label = template?.label.replace("{target}", String(challenge.target_value)) || "Complete your daily goal";

  return (
    <Card className={cn(
      "border transition-all animate-fade-in overflow-hidden",
      challenge.completed
        ? "border-success bg-success/5"
        : "border-accent/30 bg-gradient-to-r from-accent/10 to-primary/10"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {challenge.completed ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : (
              <Sparkles className="h-5 w-5 text-accent animate-pulse" />
            )}
            <span className="text-sm font-bold">Daily Challenge</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{hoursLeft}h left</span>
          </div>
        </div>

        <p className="text-sm mb-2">{label}</p>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Progress value={progressPercent} className="h-2" />
          </div>
          <span className="text-xs font-medium whitespace-nowrap">
            {challenge.current_progress}/{challenge.target_value}
          </span>
        </div>

        <div className="flex items-center gap-1 mt-2">
          <Zap className="h-3 w-3 text-accent" />
          <span className="text-xs text-accent font-bold">+{challenge.xp_reward} XP reward</span>
        </div>
      </CardContent>
    </Card>
  );
};
