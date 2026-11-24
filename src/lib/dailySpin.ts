import { supabase } from "@/integrations/supabase/client";
import type { XPAwardResult } from "@/lib/xpAward";
import { SPIN_REWARDS, type SpinReward } from "@/lib/spinWheel";

/** What the wheel is told after a spin. */
export type SpinOutcome =
  /** A prize was granted. `label` is what to show (for XP, the amount actually added). */
  | { status: "won"; index: number; reward: SpinReward; label: string; note?: string }
  /** Today's spin is already used, or today's XP limit is reached. Nothing new was granted. */
  | { status: "used"; reason: "spun" | "xp_limit" }
  /** Nothing was saved (offline, server error). The spin is handed back. */
  | { status: "failed" };

export type ServerSpin =
  | { status: "won"; index: number; type: SpinReward["type"]; value: number; awarded: number; xp: XPAwardResult | null; bonus?: number; multiplier?: number }
  | { status: "used" }
  | { status: "capped"; index: number };

/** True when the database does not have the function yet (the app was published before the migration ran). */
export function isMissingFunction(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "PGRST202" || error.code === "42883" || /could not find the function|does not exist/i.test(error.message ?? "");
}

/** Ask the server to spin. It picks the prize, grants it, and answers with the wedge to stop on.
 *  Resolves "missing" when the database has no claim_daily_spin_v2 yet, and null when the call failed. */
export async function claimDailySpin(): Promise<ServerSpin | "missing" | null> {
  try {
    // The generated types do not know this function until Lovable regenerates them.
    const { data, error } = await (supabase.rpc as unknown as (fn: string) => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>)("claim_daily_spin_v2");
    if (error) return isMissingFunction(error) ? "missing" : null;
    const spin = data as ServerSpin | null;
    if (!spin || typeof spin !== "object") return null;
    if (spin.status === "won" && !SPIN_REWARDS[spin.index]) return null;
    return spin;
  } catch {
    return null;
  }
}

/** The label for a granted prize: the XP actually added, or the prize's own name. */
export function prizeLabel(reward: SpinReward, awardedXp: number): string {
  return reward.type === "xp" ? `+${awardedXp} XP` : reward.label;
}
