/** The daily spin wheel's prizes and geometry. Wedge 0 starts at the top and wedges run clockwise; the pointer sits at the top. */

export interface SpinReward {
  /** Full name, for the win card. */
  label: string;
  /** Short name that fits on a wedge. */
  short: string;
  emoji: string;
  type: "xp" | "thot" | "boost" | "freeze" | "doubler" | "reveal" | "frame";
  value: number;
  rarity: "common" | "uncommon" | "rare" | "very_rare";
}

// The wheel's wedges, in the order the wheel draws them. The server picks and grants the prize
// (claim_daily_spin_v2 in the newest supabase/migrations file that defines it) and answers with a wedge
// number, so this list must stay in step with that function: same order, same prizes.
export const SPIN_REWARDS: SpinReward[] = [
  { label: "+5 XP", short: "+5 XP", emoji: "⚡", type: "xp", value: 5, rarity: "common" },
  { label: "Double XP", short: "2× XP", emoji: "✨", type: "doubler", value: 1, rarity: "uncommon" },
  { label: "+10 XP", short: "+10 XP", emoji: "⚡", type: "xp", value: 10, rarity: "common" },
  { label: "+1 Thot", short: "+1 Thot", emoji: "💜", type: "thot", value: 1, rarity: "rare" },
  { label: "+25 XP", short: "+25 XP", emoji: "🌟", type: "xp", value: 25, rarity: "uncommon" },
  { label: "Lucky Spin Frame", short: "Lucky Frame", emoji: "🖼️", type: "frame", value: 1, rarity: "very_rare" },
  { label: "+5 XP", short: "+5 XP", emoji: "⚡", type: "xp", value: 5, rarity: "common" },
  { label: "Mystery Match Reveal", short: "Mystery Reveal", emoji: "🔮", type: "reveal", value: 1, rarity: "uncommon" },
  { label: "+15 XP", short: "+15 XP", emoji: "⚡", type: "xp", value: 15, rarity: "common" },
  { label: "Streak Freeze", short: "Streak Freeze", emoji: "❄️", type: "freeze", value: 1, rarity: "rare" },
  { label: "+50 XP", short: "+50 XP", emoji: "💎", type: "xp", value: 50, rarity: "rare" },
  { label: "Profile Boost", short: "Profile Boost", emoji: "🚀", type: "boost", value: 1, rarity: "very_rare" },
];

/** Chance of each tier, in percent. The server uses the same numbers. */
export const SPIN_WEIGHTS: Record<SpinReward["rarity"], number> = { common: 54, uncommon: 28, rare: 13, very_rare: 5 };

/** How much a streak multiplies an XP prize. The server applies this; the app only shows it. */
export function streakSpinMultiplier(streak: number): number {
  if (streak >= 30) return 3;
  if (streak >= 14) return 2.5;
  if (streak >= 7) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

/** Only for an app that is newer than its database (claim_daily_spin_v2 missing): pick an XP wedge here,
 *  the old way. XP is the one prize the older server path can grant. */
export function pickLegacyXpReward(random: () => number = Math.random): { index: number; reward: SpinReward } {
  const xp = SPIN_REWARDS.map((reward, index) => ({ reward, index })).filter(w => w.reward.type === "xp");
  const total = xp.reduce((sum, w) => sum + SPIN_WEIGHTS[w.reward.rarity] / xp.filter(o => o.reward.rarity === w.reward.rarity).length, 0);
  let roll = random() * total;
  for (const w of xp) {
    roll -= SPIN_WEIGHTS[w.reward.rarity] / xp.filter(o => o.reward.rarity === w.reward.rarity).length;
    if (roll < 0) return w;
  }
  return xp[0];
}

/** Degrees the wheel must be turned (clockwise, 0–360) so the pointer rests inside wedge `index`.
 *  `within` moves the resting point off the wedge's centre, in degrees; keep it under half a wedge. */
export function landingRotation(index: number, wedgeCount: number, within = 0): number {
  const seg = 360 / wedgeCount;
  return (((360 - (index * seg + seg / 2 + within)) % 360) + 360) % 360;
}

/** Which wedge is under the pointer after the wheel has been turned `rotation` degrees clockwise. */
export function wedgeUnderPointer(rotation: number, wedgeCount: number): number {
  const seg = 360 / wedgeCount;
  const atTop = (((360 - rotation) % 360) + 360) % 360;
  return Math.floor(atTop / seg) % wedgeCount;
}

/** Total clockwise travel for one spin: `turns` full turns, then on to the landing rotation. */
export function spinTravel(from: number, landing: number, turns = 6): number {
  return 360 * turns + ((((landing - from) % 360) + 360) % 360);
}
