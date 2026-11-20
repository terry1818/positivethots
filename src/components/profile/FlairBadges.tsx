import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTotalBadgeCount } from "@/hooks/useTotalBadgeCount";
import { hasEveryBadge } from "@/lib/badgeCompletion";

interface FlairBadgesProps {
  streak?: number;
  badgeCount?: number;
  createdAt?: string;
  isVip?: boolean;
  maxShow?: number;
  className?: string;
}

function getTierName(badgeCount: number, total: number | undefined): string | null {
  if (total === undefined) return `${badgeCount} badges`;
  if (hasEveryBadge(badgeCount, total)) return "Master";
  if (badgeCount >= 15) return "Expert";
  if (badgeCount >= 10) return "Advanced";
  if (badgeCount >= 5) return "Foundation";
  return null;
}

export const FlairBadges = memo(({ streak = 0, badgeCount = 0, createdAt, isVip, maxShow = 2, className }: FlairBadgesProps) => {
  const { total } = useTotalBadgeCount();
  const flairs: { emoji: string; label: string; priority: number }[] = [];

  // Mentor (VIP + all badges)
  if (isVip && hasEveryBadge(badgeCount, total)) {
    flairs.push({ emoji: "💜", label: "Mentor", priority: 1 });
  }

  // Streak
  if (streak > 7) {
    flairs.push({ emoji: "🔥", label: `${streak}-day streak`, priority: 2 });
  }

  // Tier
  const tier = getTierName(badgeCount, total);
  if (tier) {
    flairs.push({ emoji: "🎓", label: tier, priority: 3 });
  }

  // New member (first 7 days)
  if (createdAt) {
    const daysSinceSignup = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceSignup <= 7) {
      flairs.push({ emoji: "✨", label: "New Member", priority: 4 });
    }
  }

  const sorted = flairs.sort((a, b) => a.priority - b.priority).slice(0, maxShow);

  if (sorted.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {sorted.map((f) => (
        <Badge
          key={f.label}
          aria-label={f.label === "Master" || f.label === "Mentor" ? `${f.label}: All badges earned` : undefined}
          variant="secondary"
          className="min-w-[112px] justify-center text-sm px-1.5 py-0 font-normal bg-background/60 backdrop-blur-sm border-border/50"
        >
          {f.emoji} {f.label}
        </Badge>
      ))}
    </div>
  );
});

FlairBadges.displayName = "FlairBadges";
