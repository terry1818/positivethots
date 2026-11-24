/** The daily spin wheel's prizes and geometry. Wedge 0 starts at the top and wedges run clockwise; the pointer sits at the top. */

export interface SpinReward {
  label: string;
  emoji: string;
  type: "xp" | "thot" | "boost" | "freeze" | "hint";
  value: number;
  rarity: "common" | "uncommon" | "rare" | "very_rare";
}

/** The most XP the server grants for one spin (award_xp, source "daily_spin"). */
export const SPIN_XP_CEILING = 50;

// Every prize is XP, because XP is what the server grants for a spin, once per UTC day.
// Do not add a prize here unless something actually grants it.
export const SPIN_REWARDS: SpinReward[] = [
  { label: "+5 XP", emoji: "⚡", type: "xp", value: 5, rarity: "common" },
  { label: "+10 XP", emoji: "⚡", type: "xp", value: 10, rarity: "common" },
  { label: "+5 XP", emoji: "⚡", type: "xp", value: 5, rarity: "common" },
  { label: "+25 XP", emoji: "🌟", type: "xp", value: 25, rarity: "uncommon" },
  { label: "+15 XP", emoji: "🌟", type: "xp", value: 15, rarity: "uncommon" },
  { label: "+40 XP", emoji: "💎", type: "xp", value: 40, rarity: "rare" },
  { label: "+30 XP", emoji: "💎", type: "xp", value: 30, rarity: "rare" },
  { label: "+50 XP", emoji: "👑", type: "xp", value: 50, rarity: "very_rare" },
];

/** Chance of each tier, in percent: common 60, uncommon 25, rare 12, very rare 3. */
export const SPIN_WEIGHTS: Record<SpinReward["rarity"], number> = { common: 60, uncommon: 25, rare: 12, very_rare: 3 };

/** Pick a prize: first the tier by its weight, then one wedge of that tier at random. */
export function pickSpinReward(random: () => number = Math.random): { index: number; reward: SpinReward } {
  const roll = random() * 100;
  let cumulative = 0;
  for (const rarity of ["common", "uncommon", "rare", "very_rare"] as const) {
    cumulative += SPIN_WEIGHTS[rarity];
    const wedges = SPIN_REWARDS.map((r, i) => (r.rarity === rarity ? i : -1)).filter(i => i >= 0);
    if (roll < cumulative && wedges.length) {
      const index = wedges[Math.floor(random() * wedges.length)];
      return { index, reward: SPIN_REWARDS[index] };
    }
  }
  return { index: 0, reward: SPIN_REWARDS[0] };
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
