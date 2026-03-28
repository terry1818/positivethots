export interface CompatibilityFactor {
  label: string;
  score: number;
  maxScore: number;
  details: string[];
}

export interface CompatibilityBreakdownResult {
  totalScore: number;
  factors: CompatibilityFactor[];
}

interface ProfileLike {
  interests?: string[] | null;
  relationship_style?: string | null;
  looking_for?: string | null;
  experience_level?: string | null;
  location?: string | null;
}

export function calculateCompatibilityBreakdown(
  user: ProfileLike,
  other: ProfileLike,
  userBadges: number,
  otherBadges: number,
): CompatibilityBreakdownResult {
  const factors: CompatibilityFactor[] = [];

  // 1. Shared Interests (max 20)
  const userInterests = new Set(user.interests || []);
  const otherInterests = new Set(other.interests || []);
  const sharedInterests = [...userInterests].filter(i => otherInterests.has(i));
  const interestScore = Math.min(20, sharedInterests.length * 4);
  factors.push({
    label: "Shared Interests",
    score: interestScore,
    maxScore: 20,
    details: sharedInterests.slice(0, 3),
  });

  // 2. Relationship Style Match (max 20)
  let styleScore = 0;
  const styleDetails: string[] = [];
  if (user.relationship_style === other.relationship_style && user.relationship_style) {
    styleScore = 20;
    const name = user.relationship_style.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    styleDetails.push(`Both ${name}`);
  } else if (
    (user.relationship_style === "polyamory" && other.relationship_style === "open") ||
    (user.relationship_style === "open" && other.relationship_style === "polyamory")
  ) {
    styleScore = 10;
    styleDetails.push("Compatible styles");
  }
  factors.push({ label: "Relationship Style", score: styleScore, maxScore: 20, details: styleDetails });

  // 3. Shared Goals (max 20)
  const userGoals = (user.looking_for || "").split(",").map(s => s.trim()).filter(Boolean);
  const otherGoals = (other.looking_for || "").split(",").map(s => s.trim()).filter(Boolean);
  const sharedGoals = userGoals.filter(g => new Set(otherGoals).has(g));
  const goalsScore = Math.min(20, sharedGoals.length * 10);
  factors.push({ label: "Shared Goals", score: goalsScore, maxScore: 20, details: sharedGoals.slice(0, 3) });

  // 4. Badge Level Similarity (max 20)
  const badgeDiff = Math.abs(userBadges - otherBadges);
  let badgeScore = 5;
  if (badgeDiff === 0) badgeScore = 20;
  else if (badgeDiff <= 2) badgeScore = 15;
  else if (badgeDiff <= 5) badgeScore = 10;
  factors.push({
    label: "Badge Level",
    score: badgeScore,
    maxScore: 20,
    details: [`You: ${userBadges}`, `Them: ${otherBadges}`],
  });

  // 5. Location Proximity (max 10)
  const locationMatch = user.location === other.location && !!user.location;
  factors.push({
    label: "Location",
    score: locationMatch ? 10 : 0,
    maxScore: 10,
    details: locationMatch ? [`Both in ${user.location}`] : [],
  });

  // 6. Experience Level Match (max 10)
  const experienceLevels = ["curious", "new", "experienced", "veteran"];
  const userExp = experienceLevels.indexOf(user.experience_level || "new");
  const otherExp = experienceLevels.indexOf(other.experience_level || "new");
  const expScore = Math.max(0, 10 - Math.abs(userExp - otherExp) * 3);
  const expLabels: Record<string, string> = { curious: "Curious", new: "New", experienced: "Experienced", veteran: "Veteran" };
  factors.push({
    label: "Experience Level",
    score: expScore,
    maxScore: 10,
    details: expScore >= 7 ? ["Similar experience"] : [],
  });

  const totalScore = Math.min(100, Math.max(0, factors.reduce((s, f) => s + f.score, 0)));

  return { totalScore, factors };
}

export function generateCompatibilityIcebreakers(factors: CompatibilityFactor[]): string[] {
  const sorted = [...factors].sort((a, b) => b.score / b.maxScore - a.score / a.maxScore);
  const icebreakers: string[] = [];

  for (const f of sorted) {
    if (icebreakers.length >= 3) break;
    if (f.score === 0) continue;

    if (f.label === "Shared Interests" && f.details.length > 0) {
      icebreakers.push(`You both love ${f.details[0]}! What got you into it?`);
    } else if (f.label === "Relationship Style" && f.details.length > 0) {
      icebreakers.push(`${f.details[0]} — how did your journey into ENM start?`);
    } else if (f.label === "Shared Goals" && f.details.length > 0) {
      icebreakers.push(`You're both looking for ${f.details[0].toLowerCase()}. What does that look like for you?`);
    } else if (f.label === "Badge Level" && f.score >= 15) {
      icebreakers.push(`You've both been learning! What's your favorite module so far?`);
    } else if (f.label === "Location" && f.details.length > 0) {
      icebreakers.push(`${f.details[0]} — what's your favorite spot around here?`);
    } else if (f.label === "Experience Level" && f.score >= 7) {
      icebreakers.push(`You seem to have similar experience levels. What's something you've learned along the way?`);
    }
  }

  return icebreakers;
}
