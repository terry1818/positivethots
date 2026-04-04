import { memo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import mascotBinoculars from "@/assets/mascot-binoculars.png";
import mascotWaving from "@/assets/mascot-waving.png";
import mascotHeart from "@/assets/mascot-heart.png";
import mascotGraduate from "@/assets/mascot-graduate.png";
import mascotConfused from "@/assets/mascot-confused.png";
import mascotShrug from "@/assets/mascot-shrug.png";

export const MASCOT_IMAGES = {
  binoculars: mascotBinoculars,
  waving: mascotWaving,
  heart: mascotHeart,
  graduate: mascotGraduate,
  confused: mascotConfused,
  shrug: mascotShrug,
} as const;

export type MascotType = keyof typeof MASCOT_IMAGES;

interface BrandedEmptyStateProps {
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
      "flex flex-col items-center justify-center text-center px-8 py-12 animate-fade-in",
      className,
    )}>
      {/* Mascot with glow */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl scale-150" />
        <img
          src={MASCOT_IMAGES[mascot]}
          alt=""
          className="relative w-[187px] h-[187px] object-contain drop-shadow-lg animate-float-gentle"
          loading="lazy"
        />
      </div>

      {/* Headline */}
      <h2 className="text-xl font-bold text-foreground mb-2 max-w-xs">
        {headline}
      </h2>

      {/* Description */}
      <p className="text-base text-muted-foreground mb-6 max-w-sm leading-relaxed">
        {description}
      </p>

      {/* CTAs */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        {ctaLabel && onCtaClick && (
          <Button
            onClick={onCtaClick}
            variant={ctaVariant}
            className="w-full rounded-full"
          >
            {ctaLabel}
          </Button>
        )}
        {secondaryLabel && onSecondaryClick && (
          <Button
            onClick={onSecondaryClick}
            variant="ghost"
            className="w-full rounded-full text-muted-foreground"
          >
            {secondaryLabel}
          </Button>
        )}
      </div>
    </div>
  );
});

BrandedEmptyState.displayName = "BrandedEmptyState";
