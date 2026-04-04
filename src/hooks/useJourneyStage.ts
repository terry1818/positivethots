export type JourneyStage = "new" | "learning" | "discovering" | "matching" | "veteran";

export function useJourneyStage(
  createdAt: string | null | undefined,
  badgeCount: number,
  matchCount: number
): JourneyStage {
  const daysSinceSignup = createdAt
    ? Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000)
    : 0;

  if (daysSinceSignup < 3 && badgeCount < 5) return "new";
  if (badgeCount < 10) return "learning";
  if (matchCount === 0) return "discovering";
  if (daysSinceSignup < 30) return "matching";
  return "veteran";
}
