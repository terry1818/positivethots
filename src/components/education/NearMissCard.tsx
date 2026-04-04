import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NearMissCardProps {
  badgesRemaining: number;
  featureLabel: string;
  tierName: string;
  onContinue: () => void;
}

export const NearMissCard = ({ badgesRemaining, featureLabel, tierName, onContinue }: NearMissCardProps) => {
  if (badgesRemaining > 2) return null;

  return (
    <Card className={cn(
      "animate-fade-in border-primary/30 bg-primary/5",
      badgesRemaining === 1 && "animate-pulse"
    )}>
      <CardContent className="p-3 flex items-center gap-3">
        <span className="text-2xl">🔥</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            Just {badgesRemaining} more badge{badgesRemaining !== 1 ? "s" : ""} to unlock {featureLabel}!
          </p>
          <p className="text-sm text-muted-foreground truncate">{tierName} tier</p>
        </div>
        <Button size="sm" onClick={onContinue} className="shrink-0">
          Go!
        </Button>
      </CardContent>
    </Card>
  );
};
