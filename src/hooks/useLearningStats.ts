import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LearningStats {
  user_id: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  streak_freeze_available: boolean;
  streak_recovered_at: string | null;
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
        setStats(data as LearningStats);
        checkStreakRisk(data as LearningStats);
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
    // Streak is at risk if they haven't done anything today
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const hours = Math.floor((endOfDay.getTime() - now.getTime()) / 3600000);
    setStreakHoursLeft(hours);
    setIsStreakAtRisk(true);
  };

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const awardXP = useCallback(async (amount: number, source: string, sourceId?: string): Promise<{ newXP: number; leveledUp: boolean; newStreak: number; streakMilestone: boolean }> => {
    if (!stats || !userId) return { newXP: 0, leveledUp: false, newStreak: 0, streakMilestone: false };

    const today = new Date().toISOString().split("T")[0];
    const lastDate = stats.last_activity_date;

    // Daily bonus: first XP of the day gets +5
    let bonusXP = 0;
    if (lastDate !== today) bonusXP = 5;
    const totalAmount = amount + bonusXP;

    try {
      // Use server-side RPC to award XP securely
      const { data, error } = await supabase.rpc("award_xp", {
        _user_id: userId,
        _amount: totalAmount,
        _source: source,
        _source_id: sourceId || null,
      });

      if (error) throw error;

      const result = data as { new_xp: number; new_level: number; new_streak: number };
      const leveledUp = result.new_level > stats.current_level;
      const streakMilestone = isStreakMilestone(result.new_streak);

      // Update local state from server response
      setStats(prev => prev ? {
        ...prev,
        total_xp: result.new_xp,
        current_level: result.new_level,
        current_streak: result.new_streak,
        longest_streak: Math.max(prev.longest_streak, result.new_streak),
        last_activity_date: today,
      } : prev);

      setIsStreakAtRisk(false);

      // Handle level-up: update profile and grant rewards
      if (leveledUp) {
        // Update profiles.learning_level
        supabase
          .from("profiles")
          .update({ learning_level: result.new_level } as any)
          .eq("id", userId)
          .then(() => {});

        // Grant level reward if applicable (fire and forget)
        if (REWARD_LEVELS.includes(result.new_level)) {
          supabase.functions
            .invoke("grant-level-reward", {
              body: { level: result.new_level },
            })
            .then(({ data: rewardData }) => {
              if (rewardData?.rewards?.length > 0) {
                console.log("Level reward granted:", rewardData.rewards);
              }
            })
            .catch((err) => {
              console.error("Level reward error:", err);
            });
        }
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

      // Update sections today count
      if (source === "section_complete") {
        setSectionsToday(prev => prev + 1);
      }

      return { newXP: totalAmount, leveledUp, newStreak: result.new_streak, streakMilestone };
    } catch (err) {
      console.error("Error awarding XP:", err);
      return { newXP: 0, leveledUp: false, newStreak: stats.current_streak, streakMilestone: false };
    }
  }, [stats, userId]);

  return { stats, loading, awardXP, reload: loadStats, sectionsToday, isStreakAtRisk, streakHoursLeft };
};
