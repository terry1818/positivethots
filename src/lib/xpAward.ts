export interface XPAwardResult {
  new_xp: number;
  new_level: number;
  new_streak: number;
  freeze_used: boolean;
  freezes_remaining: number;
  awarded: number;
}

export function xpAwardFeedback(result: XPAwardResult, previousLevel: number) {
  return {
    newXP: result.awarded,
    newLevel: result.new_level,
    leveledUp: result.awarded > 0 && result.new_level > previousLevel,
    newStreak: result.new_streak,
    freezeUsed: result.awarded > 0 && result.freeze_used,
  };
}