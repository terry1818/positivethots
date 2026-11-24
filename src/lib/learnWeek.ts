import { supabase } from "@/integrations/supabase/client";

// Today's challenge, this week's sprint and the community goal are all counted by the server from
// the XP ledger. The app only asks what they are and shows them.
export type DailyChallengeKind = "sections" | "xp" | "practice" | "reflection" | "perfect_quiz" | "badge" | "mix" | "quiz_correct";
export type DailyChallengeState = { type: DailyChallengeKind; target: number; progress: number; completed: boolean; reward: "doubler" | "freeze" | null };
export type WeekState = {
  sprint: { xp: number; tier: number; marks: number[]; ends_at: string | null; members: number };
  goal: { title: string | null; description: string | null; kind: string | null; target: number | null; progress: number; completed: boolean; ends_at: string | null; mine: number };
};

const rpc = supabase.rpc.bind(supabase) as unknown as (fn: string) => Promise<{ data: unknown; error: { message: string } | null }>;

export async function fetchDailyChallenge(): Promise<DailyChallengeState> {
  const { data, error } = await rpc("get_daily_challenge");
  if (error || !data) throw new Error(error?.message ?? "No challenge");
  return data as DailyChallengeState;
}

export async function fetchWeek(): Promise<WeekState> {
  const { data, error } = await rpc("get_week_status");
  if (error || !data) throw new Error(error?.message ?? "No week");
  return data as WeekState;
}

/** What the member is asked to do, in plain words. */
export function challengeLabel(c: Pick<DailyChallengeState, "type" | "target">): string {
  const n = c.target;
  switch (c.type) {
    case "sections": return n === 1 ? "Finish a lesson" : `Finish ${n} lessons`;
    case "xp": return `Earn ${n} XP from learning`;
    case "practice": return n === 1 ? "Do a practice round" : `Do ${n} practice rounds`;
    case "reflection": return "Write a reflection in a lesson";
    case "perfect_quiz": return "Get a perfect score on a badge quiz";
    case "badge": return "Pass a badge quiz";
    case "mix": return "Learn two different ways today";
    case "quiz_correct": return `Get ${n} quiz answers right`;
    default: return "Finish today's challenge";
  }
}

/** A hint for the kinds that are not obvious. */
export function challengeHint(type: DailyChallengeKind): string | null {
  if (type === "mix") return "A lesson, a practice round, a reflection and a quiz each count as one way.";
  if (type === "practice") return "Practice rounds are in the Practice tab.";
  if (type === "reflection") return "Reflections are the short writing prompts inside lessons.";
  return null;
}

export const rewardLabel = (reward: DailyChallengeState["reward"]) =>
  reward === "freeze" ? "a Streak Freeze" : reward === "doubler" ? "a Double XP token" : null;

export const SPRINT_MARKS = [
  { xp: 100, name: "Bronze", reward: "a Streak Freeze" },
  { xp: 250, name: "Silver", reward: "a Double XP token" },
  { xp: 500, name: "Gold", reward: "a Profile Boost" },
] as const;

/** The next mark to aim for, or null when all three are reached. */
export function nextSprintMark(xp: number) {
  return SPRINT_MARKS.find((m) => xp < m.xp) ?? null;
}

/** Whole days left, never negative; "today" when under a day. */
export function daysLeftLabel(endsAt: string | null, now = Date.now()): string {
  if (!endsAt) return "";
  const days = Math.floor((new Date(endsAt).getTime() - now) / 86400000);
  return days <= 0 ? "Ends today" : days === 1 ? "1 day left" : `${days} days left`;
}
