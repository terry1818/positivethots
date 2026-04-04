import { useEffect, useState, useCallback } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ConfettiSystem } from "./ConfettiSystem";
import { MascotReaction } from "@/components/mascot/MascotReaction";
import { haptic } from "@/lib/haptics";
import { playBadgeUnlockSound, playCelebrationSound, playMatchSound, playStreakMilestoneSound } from "@/lib/soundGenerator";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CelebrationTier = "micro" | "small" | "medium" | "large" | "epic";

interface CelebrationEngineProps {
  tier: CelebrationTier;
  trigger: number; // increment to fire
  onComplete?: () => void;
  title?: string;
  subtitle?: string;
  stats?: { label: string; value: string | number }[];
  onShare?: () => void;
  children?: React.ReactNode;
}

const TIER_DURATION: Record<CelebrationTier, number> = {
  micro: 400,
  small: 1500,
  medium: 3000,
  large: 5000,
  epic: 8000,
};

export const CelebrationEngine = ({
  tier,
  trigger,
  onComplete,
  title,
  subtitle,
  stats,
  onShare,
  children,
}: CelebrationEngineProps) => {
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (trigger === 0) return;
    setActive(true);
    setConfettiTrigger((c) => c + 1);

    // Sound
    const soundEnabled = localStorage.getItem("pt_sound_effects") !== "false";
    if (soundEnabled && !reducedMotion) {
      if (tier === "small") playBadgeUnlockSound();
      else if (tier === "medium") playCelebrationSound();
      else if (tier === "large") playMatchSound();
      else if (tier === "epic") playStreakMilestoneSound();
    }

    // Haptic
    if (tier === "small") haptic(50);
    else if (tier === "medium") haptic([50, 30, 100]);
    else if (tier === "large") haptic([100, 50, 100, 50, 200]);
    else if (tier === "epic") haptic([200, 100, 200, 100, 300]);

    // Show modal for medium+
    if (tier === "medium" || tier === "large" || tier === "epic") {
      setShowModal(true);
    }

    const timer = setTimeout(() => {
      setActive(false);
      setShowModal(false);
      onComplete?.();
    }, TIER_DURATION[tier]);

    return () => clearTimeout(timer);
  }, [trigger]);

  const handleClose = useCallback(() => {
    setShowModal(false);
    setActive(false);
    onComplete?.();
  }, [onComplete]);

  if (!active && !showModal) return null;

  // MICRO: inline flash + XP pop
  if (tier === "micro") {
    return (
      <div className="pointer-events-none fixed inset-0 z-[55]" aria-hidden="true">
        <div className="absolute inset-0 bg-success/15 animate-screen-flash" />
        {title && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 animate-xp-float">
            <span className="text-xl font-bold text-success drop-shadow-lg">{title}</span>
          </div>
        )}
      </div>
    );
  }

  // SMALL: contained confetti + mascot toast + XP toast
  if (tier === "small") {
    return (
      <>
        <ConfettiSystem intensity="light" trigger={confettiTrigger} duration={1200} />
        <div className="fixed bottom-24 right-4 z-[55] animate-slide-up" aria-hidden="true">
          <MascotReaction emotion="cheering" size="small" position="bottom-right" message={title} />
        </div>
      </>
    );
  }

  // MEDIUM / LARGE / EPIC: modal celebrations
  const confettiIntensity = tier === "medium" ? "medium" : tier === "large" ? "heavy" : "epic";
  const mascotEmotion = tier === "epic" ? "celebrating" : tier === "large" ? "celebrating" : "proud";
  const gradientClass =
    tier === "epic"
      ? "from-primary via-secondary to-pink-500"
      : tier === "large"
      ? "from-primary via-accent to-secondary"
      : "from-primary to-secondary";

  return (
    <>
      <ConfettiSystem intensity={confettiIntensity} trigger={confettiTrigger} duration={TIER_DURATION[tier]} />
      <Dialog open={showModal} onOpenChange={handleClose}>
        <DialogContent
          className={cn(
            "sm:max-w-md border-0 p-0 overflow-hidden bg-gradient-to-br",
            gradientClass
          )}
          aria-label={title || "Celebration"}
        >
          <div className="relative p-8 text-center">
            <div className="relative z-10 space-y-4">
              {/* Mascot */}
              <div className={cn(!reducedMotion && "animate-bounce-in")}>
                <MascotReaction emotion={mascotEmotion} size="large" position="inline" animate={!reducedMotion} />
              </div>

              {/* Title */}
              {title && (
                <h2
                  className={cn(
                    "text-3xl font-bold text-white",
                    !reducedMotion && "animate-fade-in"
                  )}
                  style={!reducedMotion ? { animationDelay: "0.2s", animationFillMode: "both" } : undefined}
                >
                  {title}
                </h2>
              )}

              {subtitle && (
                <p className="text-white/90 text-lg">{subtitle}</p>
              )}

              {/* Stats */}
              {stats && stats.length > 0 && (
                <div className="flex justify-center gap-6 text-white/90">
                  {stats.map((s, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl font-bold">{s.value}</div>
                      <div className="text-sm opacity-80">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {children}

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2">
                {onShare && (
                  <Button
                    className="w-full bg-white text-primary hover:bg-white/90 font-semibold rounded-xl"
                    onClick={onShare}
                  >
                    Share Achievement 🎉
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full text-white hover:bg-white/20 text-sm"
                  onClick={handleClose}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
