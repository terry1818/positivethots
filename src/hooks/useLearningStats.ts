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
}

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const LEVEL_NAMES = ["Curious", "Explorer", "Learner", "Scholar", "Expert", "Sage", "Master", "Luminary", "Visionary", "Legend"];

export const getLevelName = (level: number) => LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)] || "Legend";

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

export const useLearningStats = () => {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

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
      } else {
        // Create initial stats
        const initial: LearningStats = {
          user_id: session.user.id,
          total_xp: 0,
          current_level: 1,
          current_streak: 0,
          longest_streak: 0,
          last_activity_date: null,
          streak_freeze_available: false,
        };
        await supabase.from("user_learning_stats").insert(initial);
        setStats(initial);
      }
    } catch (err) {
      console.error("Error loading learning stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const awardXP = useCallback(async (amount: number, source: string, sourceId?: string): Promise<{ newXP: number; leveledUp: boolean; newStreak: number; streakMilestone: boolean }> => {
    if (!stats || !userId) return { newXP: 0, leveledUp: false, newStreak: 0, streakMilestone: false };

    const today = new Date().toISOString().split("T")[0];
    const lastDate = stats.last_activity_date;

    let newStreak = stats.current_streak;
    let streakMilestone = false;

    if (lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastDate === yesterdayStr) {
        newStreak = stats.current_streak + 1;
      } else if (!lastDate) {
        newStreak = 1;
      } else if (stats.streak_freeze_available && lastDate) {
        // Use streak freeze
        newStreak = stats.current_streak;
      } else {
        newStreak = 1;
      }
      streakMilestone = isStreakMilestone(newStreak);
    }

    const newTotalXP = stats.total_xp + amount;
    const newLevel = calculateLevel(newTotalXP);
    const leveledUp = newLevel > stats.current_level;
    const newLongest = Math.max(stats.longest_streak, newStreak);
    const freezeAvailable = newStreak > 0 && newStreak % 7 === 0 ? true : stats.streak_freeze_available;

    const updatedStats: LearningStats = {
      ...stats,
      total_xp: newTotalXP,
      current_level: newLevel,
      current_streak: newStreak,
      longest_streak: newLongest,
      last_activity_date: today,
      streak_freeze_available: lastDate !== today ? (stats.streak_freeze_available && lastDate && lastDate !== new Date(Date.now() - 86400000).toISOString().split("T")[0] ? false : freezeAvailable) : stats.streak_freeze_available,
    };

    // Optimistic update
    setStats(updatedStats);

    // Persist
    await Promise.all([
      supabase.from("user_learning_stats").update({
        total_xp: newTotalXP,
        current_level: newLevel,
        current_streak: newStreak,
        longest_streak: newLongest,
        last_activity_date: today,
        streak_freeze_available: freezeAvailable,
      }).eq("user_id", userId),
      supabase.from("xp_transactions").insert({
        user_id: userId,
        xp_amount: amount,
        source,
        source_id: sourceId || null,
      }),
    ]);

    return { newXP: amount, leveledUp, newStreak, streakMilestone };
  }, [stats, userId]);

  return { stats, loading, awardXP, reload: loadStats };
};
