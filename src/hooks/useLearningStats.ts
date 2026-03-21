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
        newStreak = stats.current_streak;
      } else {
        newStreak = 1;
      }
      streakMilestone = isStreakMilestone(newStreak);
    }

    const totalAmount = amount + bonusXP;
    const newTotalXP = stats.total_xp + totalAmount;
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

    setStats(updatedStats);
    setIsStreakAtRisk(false);

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
        xp_amount: totalAmount,
        source,
        source_id: sourceId || null,
      }),
    ]);

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

    return { newXP: totalAmount, leveledUp, newStreak, streakMilestone };
  }, [stats, userId]);

  return { stats, loading, awardXP, reload: loadStats, sectionsToday, isStreakAtRisk, streakHoursLeft };
};
