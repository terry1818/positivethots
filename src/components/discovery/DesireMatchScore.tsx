interface DesireMatchScoreProps {
  userDesireIds: string[];
  profileDesireIds: string[];
}

export const calculateDesireMatchScore = (
  userDesireIds: string[],
  profileDesireIds: string[]
): number => {
  if (userDesireIds.length === 0 || profileDesireIds.length === 0) return 0;
  const userSet = new Set(userDesireIds);
  const profileSet = new Set(profileDesireIds);
  let shared = 0;
  userSet.forEach(id => { if (profileSet.has(id)) shared++; });
  const union = new Set([...userDesireIds, ...profileDesireIds]).size;
  return union > 0 ? Math.round((shared / union) * 100) : 0;
};

export const DesireMatchScore = ({ userDesireIds, profileDesireIds }: DesireMatchScoreProps) => {
  const score = calculateDesireMatchScore(userDesireIds, profileDesireIds);
  if (score === 0) return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary"
      aria-label={`${score}% desire compatibility`}
    >
      💜 {score}% desire match
    </span>
  );
};
