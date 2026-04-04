import { useMemo } from "react";
import { useUserDesires, CATEGORY_COLORS, type UserDesire } from "@/hooks/useDesires";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface DesireTagDisplayProps {
  userId: string;
  maxDisplay?: number;
  desires?: UserDesire[];
}

export const DesireTagDisplay = ({ userId, maxDisplay = 6, desires: propDesires }: DesireTagDisplayProps) => {
  const { data: fetchedDesires } = useUserDesires(propDesires ? undefined : userId);
  const desires = propDesires || fetchedDesires || [];

  const sorted = useMemo(() => {
    return [...desires]
      .filter(d => d.visibility === "public" && d.desire)
      .sort((a, b) => b.priority - a.priority);
  }, [desires]);

  const visible = sorted.slice(0, maxDisplay);
  const remaining = sorted.length - visible.length;

  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5" role="list" aria-label="Desires and interests">
      {visible.map(d => {
        const category = d.desire?.category || "";
        const colorClass = CATEGORY_COLORS[category] || "bg-muted text-foreground";

        return (
          <span
            key={d.id}
            role="listitem"
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
              colorClass
            )}
          >
            {d.desire?.emoji && <span>{d.desire.emoji}</span>}
            {d.desire?.label}
            {d.priority >= 2 && <Star className="h-2.5 w-2.5 fill-current" />}
          </span>
        );
      })}
      {remaining > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground">
          +{remaining} more
        </span>
      )}
    </div>
  );
};
