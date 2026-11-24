import { memo, type ReactNode } from "react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { GuideArt, type GuideName } from "@/components/mascot/GuideArt";

export const MASCOT_IMAGES = {
  binoculars: "guide-tier-advanced", waving: "guide-waving", heart: "guide-high-five",
  graduate: "guide-graduate", confused: "guide-thinking", shrug: "guide-encourage",
  chat: "guide-story-chat", chest: "guide-chest-open", calm: "guide-meditate",
  health: "guide-tier-sexual-health", together: "guide-study-together", community: "guide-celebrate-all",
  express: "guide-tier-identity", sleepy: "guide-sleepy", learning: "guide-tier-foundation",
} as const satisfies Record<string, GuideName>;

export type MascotType = keyof typeof MASCOT_IMAGES;

interface BrandedEmptyStateProps {
  illustration?: ReactNode;
  mascot: MascotType;
  headline: string;
  description: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  ctaVariant?: "default" | "outline" | "secondary";
  className?: string;
  /** Secondary button */
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
}

export const BrandedEmptyState = memo(({
  mascot,
  illustration,
  headline,
  description,
  ctaLabel,
  onCtaClick,
  ctaVariant = "default",
  className,
  secondaryLabel,
  onSecondaryClick,
}: BrandedEmptyStateProps) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center px-6 py-10",
      className,
    )}>
      {/* Character on a picture panel, the same way lessons show art */}
      <div className="kit-panel kit-rise w-full max-w-[300px] h-[188px] mb-6">
        {illustration || <GuideArt name={MASCOT_IMAGES[mascot]} size={168} />}
      </div>

      <h2 className="kit-rise text-xl font-extrabold text-foreground mb-2 max-w-xs [text-wrap:balance]" style={{ "--i": 1 } as React.CSSProperties}>
        {headline}
      </h2>

      <p className="kit-rise text-base text-muted-foreground mb-6 max-w-sm leading-relaxed [text-wrap:pretty]" style={{ "--i": 2 } as React.CSSProperties}>
        {description}
      </p>

      <div className="kit-rise flex flex-col items-center gap-3 w-full max-w-xs" style={{ "--i": 3 } as React.CSSProperties}>
        {ctaLabel && onCtaClick && (
          <Button
            onClick={onCtaClick}
            variant={ctaVariant}
            className={cn("w-full", ctaVariant === "default" ? "kit-cta" : "min-h-[48px] rounded-2xl font-bold")}
          >
            {ctaLabel}
          </Button>
        )}
        {secondaryLabel && onSecondaryClick && (
          <Button
            onClick={onSecondaryClick}
            variant="ghost"
            className="w-full min-h-[44px] rounded-2xl text-muted-foreground"
          >
            {secondaryLabel}
          </Button>
        )}
      </div>
    </div>
  );
});

BrandedEmptyState.displayName = "BrandedEmptyState";
