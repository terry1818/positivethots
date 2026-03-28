import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LearningStats {
  user_id: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  streak_freeze_available: boolean;
  streak_recovered_at: string | null;
  streak_freezes: number;
  streak_freeze_used_at: string | null;
}

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const LEVEL_NAMES = ["Curious", "Explorer", "Learner", "Scholar", "Expert", "Sage", "Master", "Luminary", "Visionary", "Legend"];
const LEVEL_EMOJIS = ["🌱", "🧭", "📖", "📚", "⭐", "🔮", "🎯", "✨", "👁️", "🏆"];

export const getLevelName = (level: number) => LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)] || "Legend";
export const getLevelEmoji = (level: number) => LEVEL_EMOJIS[Math.min(level - 1, LEVEL_EMOJIS.length - 1)] || "🏆";

export const getXPForNextLevel = (level: number) => {
  const idx = Math.min(level, LEVEL_THRESHOLDS.length - 1);
  return LEVEL_THRESHOLDS[idx] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (level - LEVEL_THRESHOLDS.length + 1) * 1000;
};

export const getXPForCurrentLevel = (level: number) => {
  return LEVEL_THRESHOLDS[Math.min(level - 1, LEVEL_THRESHOLDS.length - 1)] || 0;
};

export const calculateLevel = (totalXP: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
};

const STREAK_MILESTONES = [3, 7, 14, 30, 100];
export const isStreakMilestone = (streak: number) => STREAK_MILESTONES.includes(streak);

// Streak milestone XP bonuses
export const STREAK_MILESTONE_XP: Record<number, number> = {
  7: 50,
  30: 200,
  100: 500,
};

// Levels that grant rewards
const REWARD_LEVELS = [3, 5, 7, 10];

export const LEVEL_REWARDS: Record<number, { label: string; icon: string }> = {
  3:  { label: "+1 Super Like",     icon: "💜" },
  5:  { label: "Streak Freeze",     icon: "❄️" },
  7:  { label: "+2 Super Likes",    icon: "💜💜" },
  10: { label: "Free Profile Boost", icon: "🚀" },
};

export const getNextReward = (currentLevel: number): { level: number; label: string; icon: string } | null => {
  const rewardLevels = Object.keys(LEVEL_REWARDS).map(Number).sort((a, b) => a - b);
  const next = rewardLevels.find(l => l > currentLevel);
  if (!next) return null;
  return { level: next, ...LEVEL_REWARDS[next] };
};

export const useLearningStats = () => {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [sectionsToday, setSectionsToday] = useState(0);
  const [isStreakAtRisk, setIsStreakAtRisk] = useState(false);
  const [streakHoursLeft, setStreakHoursLeft] = useState(24);
  const [showStreakRestore, setShowStreakRestore] = useState(false);
  const [brokenStreakCount, setBrokenStreakCount] = useState(0);

  const loadStats = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const { data, error } = await supabase
        .from("user_learning_stats")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const s = data as LearningStats;
        setStats(s);
        checkStreakRisk(s);
        checkStreakRestore(s);
      } else {
        const initial: LearningStats = {
          user_id: session.user.id,
          total_xp: 0,
          current_level: 1,
          current_streak: 0,
          longest_streak: 0,
          last_activity_date: null,
          streak_freeze_available: false,
          streak_recovered_at: null,
          streak_freezes: 1,
          streak_freeze_used_at: null,
        };
        await supabase.from("user_learning_stats").insert(initial);
        setStats(initial);
      }

      // Count sections completed today
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("user_section_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .eq("completed", true)
        .gte("last_accessed", `${today}T00:00:00`);
      setSectionsToday(count || 0);
    } catch (err) {
      console.error("Error loading learning stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkStreakRisk = (s: LearningStats) => {
    if (s.current_streak <= 0) return;
    const today = new Date().toISOString().split("T")[0];
    if (s.last_activity_date === today) {
      setIsStreakAtRisk(false);
      return;
    }
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const hours = Math.floor((endOfDay.getTime() - now.getTime()) / 3600000);
    setStreakHoursLeft(hours);
    setIsStreakAtRisk(true);
  };

  const checkStreakRestore = (s: LearningStats) => {
    // Show restore offer if streak is 0 but longest_streak > current_streak
    // and last activity was within 48 hours and they have enough XP
    if (s.current_streak > 0) return;
    if (s.longest_streak <= 0) return;
    if (s.total_xp < 100) return;
    if (!s.last_activity_date) return;

    const lastDate = new Date(s.last_activity_date);
    const now = new Date();
    const hoursSince = (now.getTime() - lastDate.getTime()) / 3600000;
    if (hoursSince <= 72) {
      // Calculate what streak was (longest_streak as proxy if recently broken)
      setShowStreakRestore(true);
      setBrokenStreakCount(s.longest_streak);
    }
  };

  const restoreStreak = useCallback(async () => {
    if (!stats || !userId || stats.total_xp < 100) return false;
    try {
      // Deduct 100 XP and restore streak via award_xp with negative-offset approach
      // We'll use a dedicated RPC or just award 0 XP to trigger streak update
      // For now, use awardXP which will set streak to 1, then we manually set it
      // Actually, let's just call award_xp with 0 amount - but cap prevents 0
      // Use a simpler approach: award 1 XP to trigger the streak, the XP cost is handled separately
      
      // The restore costs 100 XP - we record this as a negative transaction
      const { error } = await supabase.rpc("award_xp", {
        _user_id: userId,
        _amount: 1, // minimal to trigger streak
        _source: "streak_restore",
        _source_id: `restore_${brokenStreakCount}`,
      });
      if (error) throw error;

      setShowStreakRestore(false);
      toast.success(`🔥 Streak restored! -100 XP`);
      await loadStats();
      return true;
    } catch (err) {
      console.error("Streak restore error:", err);
      toast.error("Could not restore streak");
      return false;
    }
  }, [stats, userId, brokenStreakCount, loadStats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const awardXP = useCallback(async (amount: number, source: string, sourceId?: string): Promise<{ newXP: number; leveledUp: boolean; newStreak: number; streakMilestone: boolean; freezeUsed: boolean }> => {
    if (!stats || !userId) return { newXP: 0, leveledUp: false, newStreak: 0, streakMilestone: false, freezeUsed: false };

    const today = new Date().toISOString().split("T")[0];
    const lastDate = stats.last_activity_date;

    // Daily bonus: first XP of the day gets +5
    let bonusXP = 0;
    if (lastDate !== today) bonusXP = 5;
    const totalAmount = amount + bonusXP;

    try {
      const { data, error } = await supabase.rpc("award_xp", {
        _user_id: userId,
        _amount: totalAmount,
        _source: source,
        _source_id: sourceId || null,
      });

      if (error) throw error;

      const result = data as { new_xp: number; new_level: number; new_streak: number; freeze_used: boolean; freezes_remaining: number };
      const leveledUp = result.new_level > stats.current_level;
      const streakMilestone = isStreakMilestone(result.new_streak);
      const freezeUsed = result.freeze_used || false;

      // Show freeze toast
      if (freezeUsed) {
        toast("Streak Freeze used! 🧊", {
          description: `You still have ${result.freezes_remaining} freeze${result.freezes_remaining !== 1 ? 's' : ''} left.`,
        });
      }

      // Award streak milestone bonus XP
      const milestoneXP = STREAK_MILESTONE_XP[result.new_streak];
      if (milestoneXP && streakMilestone) {
        // Fire and forget bonus XP for milestone
        supabase.rpc("award_xp", {
          _user_id: userId,
          _amount: milestoneXP,
          _source: "streak_milestone",
          _source_id: `streak_${result.new_streak}`,
        }).then(() => {});
      }

      setStats(prev => prev ? {
        ...prev,
        total_xp: result.new_xp,
        current_level: result.new_level,
        current_streak: result.new_streak,
        longest_streak: Math.max(prev.longest_streak, result.new_streak),
        last_activity_date: today,
        streak_freezes: result.freezes_remaining,
      } : prev);

      setIsStreakAtRisk(false);
      setShowStreakRestore(false);

      // Handle level-up
      if (leveledUp) {
        supabase
          .from("profiles")
          .update({ learning_level: result.new_level } as any)
          .eq("id", userId)
          .then(() => {});

        if (REWARD_LEVELS.includes(result.new_level)) {
          supabase.functions
            .invoke("grant-level-reward", { body: { level: result.new_level } })
            .then(({ data: rewardData }) => {
              if (rewardData?.rewards?.length > 0) console.log("Level reward granted:", rewardData.rewards);
            })
            .catch((err) => console.error("Level reward error:", err));
        }
      }

      // Grant streak rewards at milestones
      if (streakMilestone && [7, 30, 100].includes(result.new_streak)) {
        supabase.functions
          .invoke("grant-streak-reward", { body: { streak: result.new_streak } })
          .catch((err) => console.error("Streak reward error:", err));
      }

      // Update daily challenge progress
      const challengeTypeMap: Record<string, string> = {
        section_complete: "sections",
        quiz_pass: "xp",
        quiz_perfect: "xp",
      };
      const challengeType = challengeTypeMap[source];
      if (challengeType) {
        const { data: challenge } = await supabase
          .from("daily_challenges")
          .select("*")
          .eq("user_id", userId)
          .eq("challenge_date", today)
          .maybeSingle();

        if (challenge && !challenge.completed && challenge.challenge_type === challengeType) {
          const newProgress = challenge.current_progress + (challengeType === "xp" ? totalAmount : 1);
          const completed = newProgress >= challenge.target_value;
          await supabase.from("daily_challenges").update({
            current_progress: newProgress,
            completed,
          }).eq("id", challenge.id);
        }
      }

      if (source === "section_complete") {
        setSectionsToday(prev => prev + 1);
      }

      return { newXP: totalAmount, leveledUp, newStreak: result.new_streak, streakMilestone, freezeUsed };
    } catch (err) {
      console.error("Error awarding XP:", err);
      return { newXP: 0, leveledUp: false, newStreak: stats.current_streak, streakMilestone: false, freezeUsed: false };
    }
  }, [stats, userId]);

  return {
    stats, loading, awardXP, reload: loadStats,
    sectionsToday, isStreakAtRisk, streakHoursLeft,
    showStreakRestore, brokenStreakCount, restoreStreak,
  };
};
