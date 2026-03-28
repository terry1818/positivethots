import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { FrameId } from "@/components/profile/ProfileFrame";

/**
 * Computes which frames a user has earned and updates the DB if needed.
 * Call once on profile load.
 */
export async function syncEarnedFrames(userId: string): Promise<string[]> {
  const earned: FrameId[] = ["newbie"];

  // Fetch data in parallel
  const [badgeResult, statsResult, matchResult, profileResult] = await Promise.all([
    supabase.from("user_badges").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("user_learning_stats").select("current_streak, longest_streak").eq("user_id", userId).maybeSingle(),
    supabase.from("matches").select("id", { count: "exact", head: true })
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
    supabase.from("profiles").select("created_at, earned_frames").eq("id", userId).single(),
  ]);

  const badgeCount = badgeResult.count || 0;
  const longestStreak = statsResult.data?.longest_streak || 0;
  const currentStreak = statsResult.data?.current_streak || 0;
  const matchCount = matchResult.count || 0;

  // Scholar: 5+ foundation badges
  if (badgeCount >= 5) earned.push("scholar");

  // Streak Master: 30-day streak (current or longest)
  if (longestStreak >= 30 || currentStreak >= 30) earned.push("streak_master");

  // Century Club: 100-day streak
  if (longestStreak >= 100 || currentStreak >= 100) earned.push("century_club");

  // Social Butterfly: 50+ matches
  if (matchCount >= 50) earned.push("social_butterfly");

  // Educator: all 20 badges
  if (badgeCount >= 20) earned.push("educator");

  // OG: among first 100 users (check created_at rank)
  if (profileResult.data?.created_at) {
    const { count: earlierCount } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .lt("created_at", profileResult.data.created_at);
    if ((earlierCount || 0) < 100) earned.push("og");
  }

  // Update DB if changed
  const currentEarned = (profileResult.data as any)?.earned_frames || ["newbie"];
  const earnedSet = new Set(earned);
  const currentSet = new Set(currentEarned as string[]);
  const hasNew = earned.some(f => !currentSet.has(f));

  if (hasNew) {
    const merged = [...new Set([...currentEarned as string[], ...earned])];
    await supabase.from("profiles").update({ earned_frames: merged } as any).eq("id", userId);
    return merged;
  }

  return currentEarned as string[];
}
