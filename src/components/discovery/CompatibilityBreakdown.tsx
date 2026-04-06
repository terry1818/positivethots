import { memo, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Sparkles, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CompatibilityBreakdownResult } from "@/lib/compatibility";
import { generateCompatibilityIcebreakers } from "@/lib/compatibility";

interface CompatibilityBreakdownProps {
  breakdown: CompatibilityBreakdownResult;
  otherName: string;
  onCopyIcebreaker?: (text: string) => void;
  className?: string;
}

const getBarColor = (score: number, max: number) => {
  const ratio = score / max;
  if (ratio >= 0.8) return "bg-primary"; // bright purple (great)
  if (ratio >= 0.5) return "bg-primary/60"; // medium purple
  return "bg-muted-foreground/30"; // light gray
};

export const CompatibilityBreakdown = memo(({
  breakdown,
  otherName,
  onCopyIcebreaker,
  className,
}: CompatibilityBreakdownProps) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const icebreakers = generateCompatibilityIcebreakers(breakdown.factors);

  const handleCopy = (text: string, idx: number) => {
    if (onCopyIcebreaker) {
      onCopyIcebreaker(text);
    } else {
      navigator.clipboard.writeText(text);
    }
    setCopiedIdx(idx);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className={cn("space-y-5", className)}>
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground">Why You Matched 💜</h3>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-4xl font-bold text-primary">{breakdown.totalScore}%</span>
          <span className="text-muted-foreground text-sm">Compatible</span>
        </div>
      </div>

      {/* Factor bars */}
      <div className="space-y-3">
        {breakdown.factors.map((factor) => (
          <div key={factor.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{factor.label}</span>
              <span className="text-muted-foreground text-sm">
                {factor.score}/{factor.maxScore}
              </span>
            </div>
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500 ease-out",
                  getBarColor(factor.score, factor.maxScore)
                )}
                style={{ width: `${(factor.score / factor.maxScore) * 100}%` }}
              />
            </div>
            {factor.details.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {factor.details.map((d) => (
                  <Badge
                    key={d}
                    variant="secondary"
                    className="text-sm px-2 py-0 font-normal"
                  >
                    {d}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Icebreakers */}
      {icebreakers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Conversation starters</span>
          </div>
          {icebreakers.map((text) => (
            <button
              key={text}
              onClick={() => handleCopy(text, icebreakers.indexOf(text))}
              className="w-full text-left p-2.5 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors text-sm text-foreground group"
            >
              <div className="flex items-start gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <span className="flex-1">{text}</span>
                <Copy className={cn(
                  "h-3.5 w-3.5 shrink-0 mt-0.5 transition-colors",
                  copiedIdx === idx ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                )} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

CompatibilityBreakdown.displayName = "CompatibilityBreakdown";
