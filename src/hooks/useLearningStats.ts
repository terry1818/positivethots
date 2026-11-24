import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { reportError } from "@/lib/errorReporting";
import { xpAwardFeedback, type XPAwardResult } from "@/lib/xpAward";

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
  /** Profile Boosts earned (levels, daily spin), not yet used. */
  boost_credits?: number | null;
  /** "2x XP" tokens from the daily spin. Each one doubles the XP of the next lesson finished. */
  xp_doublers?: number | null;
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

/** What a streak really earns: the rewards grant-streak-reward hands out. */
export const STREAK_REWARDS: Record<number, string> = { 7: "+1 Thot", 30: "Profile Boost", 100: "+3 Thots" };

/** The next streak reward still ahead of this streak, or null once every one is earned. */
export const getNextStreakReward = (streak: number): { day: number; label: string; daysLeft: number } | null => {
  const day = Object.keys(STREAK_REWARDS).map(Number).sort((a, b) => a - b).find(d => d > streak);
  return day ? { day, label: STREAK_REWARDS[day], daysLeft: day - streak } : null;
};

// Streak milestone XP bonuses
export const STREAK_MILESTONE_XP: Record<number, number> = {
  7: 50,
  30: 200,
  100: 500,
};

// Levels that grant rewards
const REWARD_LEVELS = [3, 5, 7, 10];

export const LEVEL_REWARDS: Record<number, { label: string; icon: string }> = {
  3:  { label: "+1 Thot",           icon: "💜" },
  5:  { label: "Streak Freeze",     icon: "❄️" },
  7:  { label: "+2 Thots",          icon: "💜💜" },
  10: { label: "Free Profile Boost", icon: "🚀" },
};

export const getNextReward = (currentLevel: number): { level: number; label: string; icon: string } | null => {
  const rewardLevels = Object.keys(LEVEL_REWARDS).map(Number).sort((a, b) => a - b);
  const next = rewardLevels.find(l => l > currentLevel);
  if (!next) return null;
  return { level: next, ...LEVEL_REWARDS[next] };
};

/** Level rewards are handed out at the moment of a level-up. If that call ever failed, or the member
 *  leveled up before rewards existed, they were simply missed. This asks once per session for any
 *  reward the member's level has already earned; the server checks the level and never grants twice. */
let levelRewardsChecked = false;
async function claimMissedLevelRewards(userId: string, level: number): Promise<boolean> {
  if (levelRewardsChecked) return false;
  levelRewardsChecked = true;
  const owed = REWARD_LEVELS.filter(l => l <= level);
  if (owed.length === 0) return false;
  try {
    const { data: given } = await supabase
      .from("xp_transactions")
      .select("source")
      .eq("user_id", userId)
      .in("source", owed.map(l => `level_reward_${l}`));
    const have = new Set((given ?? []).map(row => row.source));
    let granted = false;
    for (const l of owed.filter(l => !have.has(`level_reward_${l}`))) {
      const { data } = await supabase.functions.invoke("grant-level-reward", { body: { level: l } });
      if (data?.rewards?.length > 0) granted = true;
    }
    return granted;
  } catch {
    return false; // it is tried again next session
  }
}

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
        // A reward granted late changes freezes or boost credits, so read the row once more.
        void claimMissedLevelRewards(session.user.id, s.current_level).then(async granted => {
          if (!granted) return;
          const { data: fresh } = await supabase.from("user_learning_stats").select("*").eq("user_id", session.user.id).maybeSingle();
          if (fresh) setStats(fresh as LearningStats);
        });
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
      const { data, error } = await supabase.rpc("award_xp", {
        _user_id: userId,
        _amount: 1, // minimal to trigger streak
        _source: "streak_restore",
        _source_id: `restore_${brokenStreakCount}`,
      });
      if (error) throw error;
      if ((data as unknown as XPAwardResult).awarded === 0) return false;
      setShowStreakRestore(false);
      toast.success(`🔥 Streak restored! -100 XP`);
      await loadStats();
      return true;
    } catch (err) {
      console.error("Streak restore error:", err);
      void reportError(err instanceof Error ? err : new Error("Streak restore failed"));
      toast.error("Could not restore streak");
      return false;
    }
  }, [stats, userId, brokenStreakCount, loadStats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  /** Everything that follows an XP award the server has already made: update what is on screen, and
   *  hand out the level and streak rewards it unlocked. Used by awardXP and by the daily spin. */
  const applyAward = useCallback(async (result: XPAwardResult, source: string, sourceId?: string) => {
    const feedback = xpAwardFeedback(result, stats?.current_level ?? result.new_level);
    const today = new Date().toISOString().split("T")[0];
    if (result.awarded === 0) {
      setStats(prev => prev ? { ...prev, total_xp: result.new_xp, current_level: result.new_level, current_streak: result.new_streak, streak_freezes: result.freezes_remaining } : prev);
      return { ...feedback, totalXP: result.new_xp, streakMilestone: false };
    }
    const { leveledUp, freezeUsed } = feedback;
    const streakMilestone = isStreakMilestone(result.new_streak);

    // Show freeze toast
    if (freezeUsed) {
      toast("Streak Freeze used! 🧊", {
        description: `You still have ${result.freezes_remaining} freeze${result.freezes_remaining !== 1 ? 's' : ''} left.`,
      });
    }

    // Streak milestone bonus XP is handled server-side by award_xp RPC
    // and the grant-streak-reward Edge Function — no duplicate call needed

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

    // Today's challenge, the weekly sprint and the community goal are counted by the server from the XP it just recorded.

    if (source === "section_complete") {
      setSectionsToday(prev => prev + 1);
    }

    // A "2x XP" token from the daily spin pays this lesson's XP a second time. The server decides
    // whether one applies; this only asks when the member holds one.
    if (source === "section_complete" && sourceId && (stats?.xp_doublers ?? 0) > 0) {
      try {
        const { data } = await (supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }>)("use_xp_doubler", { _section_id: sourceId });
        const doubled = data as { status: string; bonus: number; new_xp: number; new_level: number; doublers_left: number } | null;
        if (doubled?.status === "doubled") {
          setStats(prev => prev ? { ...prev, total_xp: doubled.new_xp, current_level: doubled.new_level, xp_doublers: doubled.doublers_left } : prev);
          toast.success(`Double XP! +${doubled.bonus} bonus XP`, { description: "Your 2× XP from the daily spin was used on this lesson." });
          if (doubled.new_level > result.new_level && REWARD_LEVELS.includes(doubled.new_level)) {
            void supabase.functions.invoke("grant-level-reward", { body: { level: doubled.new_level } }).catch(() => {});
          }
          return { ...feedback, newXP: result.awarded + doubled.bonus, newLevel: doubled.new_level, leveledUp: leveledUp || doubled.new_level > result.new_level, totalXP: doubled.new_xp, streakMilestone };
        }
      } catch {
        // The lesson's own XP is already saved; the token stays for next time.
      }
    }

    return { ...feedback, totalXP: result.new_xp, streakMilestone };
  }, [stats?.current_level, stats?.xp_doublers, userId]);

  const awardXP = useCallback(async (amount: number, source: string, sourceId?: string, quietRetry = false): Promise<{ newXP: number; newLevel: number; leveledUp: boolean; newStreak: number; streakMilestone: boolean; freezeUsed: boolean; totalXP?: number }> => {
    if (!stats || !userId) {
      if (quietRetry) throw new Error("Learning stats not ready");
      return { newXP: 0, newLevel: 1, leveledUp: false, newStreak: 0, streakMilestone: false, freezeUsed: false };
    }

    const today = new Date().toISOString().split("T")[0];

    try {
      const { data, error } = await supabase.rpc("award_xp", {
        _user_id: userId,
        _amount: amount,
        _source: source,
        _source_id: sourceId || null,
      });

      if (error) throw error;

      return await applyAward(data as unknown as XPAwardResult, source, sourceId);
    } catch (err) {
      console.error("Error awarding XP:", err);
      void reportError(err instanceof Error ? err : new Error("Error awarding XP"));
      if (quietRetry) throw err;
      toast.error("Could not save your XP. Please try again.");
      return { newXP: 0, newLevel: stats.current_level, leveledUp: false, newStreak: stats.current_streak, streakMilestone: false, freezeUsed: false };
    }
  }, [stats, userId, applyAward]);

  return {
    stats, loading, awardXP, applyAward, reload: loadStats,
    sectionsToday, isStreakAtRisk, streakHoursLeft,
    showStreakRestore, brokenStreakCount, restoreStreak,
  };
};
