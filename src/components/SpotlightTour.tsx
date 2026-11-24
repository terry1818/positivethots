import { GuideArt } from "@/components/mascot/GuideArt";
import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

export interface TourStep {
  /** data-tour attribute value on the target element */
  target: string;
  title: string;
  description: string;
  position?: "above" | "below";
}

interface SpotlightTourProps {
  steps: TourStep[];
  onComplete: () => void;
  tourKey: string;
}

const PADDING = 8;

export const SpotlightTour = ({ steps, onComplete, tourKey }: SpotlightTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const tooltipRef = useRef<HTMLDivElement>(null);
  // Measured height of the tip, so it can be kept on screen.
  const [tipHeight, setTipHeight] = useState(170);

  const updateTargetRect = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return;
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (el) {
      el.scrollIntoView({
        behavior: prefersReducedMotion ? "instant" as ScrollBehavior : "smooth",
        block: "center",
      });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTargetRect(el.getBoundingClientRect());
        });
      });
    } else {
      setTargetRect(null);
    }
  }, [currentStep, steps, prefersReducedMotion]);

  useEffect(() => {
    updateTargetRect();
    let timeout: ReturnType<typeof setTimeout>;
    const debouncedUpdate = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const step = steps[currentStep];
        if (!step) return;
        const el = document.querySelector(`[data-tour="${step.target}"]`);
        if (el) setTargetRect(el.getBoundingClientRect());
      }, 50);
    };
    window.addEventListener("resize", debouncedUpdate);
    window.addEventListener("scroll", debouncedUpdate, { passive: true });
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", debouncedUpdate);
      window.removeEventListener("scroll", debouncedUpdate);
    };
  }, [updateTargetRect, currentStep, steps]);

  // Skip missing targets
  useEffect(() => {
    const step = steps[currentStep];
    if (!step) return;
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) {
      const timer = setTimeout(() => {
        if (currentStep >= steps.length - 1) {
          onComplete();
        } else {
          setCurrentStep(s => s + 1);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentStep, steps, onComplete]);

  useEffect(() => {
    tooltipRef.current?.focus();
  }, [currentStep]);

  useLayoutEffect(() => {
    const height = tooltipRef.current?.offsetHeight;
    if (height && height !== tipHeight) setTipHeight(height);
  }, [currentStep, targetRect, tipHeight]);

  // Auto-advance if user clicks on the spotlighted element
  useEffect(() => {
    const step = steps[currentStep];
    if (!step) return;
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) return;
    const handler = () => handleNext();
    el.addEventListener("click", handler, { once: true });
    return () => el.removeEventListener("click", handler);
  }, [currentStep, steps]);

  const handleNext = () => {
    if (currentStep >= steps.length - 1) {
      onComplete();
    } else {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentStep((s) => s + 1);
        setTransitioning(false);
      }, 150);
    }
  };

  const step = steps[currentStep];
  if (!step) return null;

  const isLast = currentStep === steps.length - 1;
  const pos = step.position || "below";

  // Where the tip goes: on the asked-for side of the target if it fits there, else the other side,
  // else over the bottom of the target. It is never allowed off the screen, so "Next" is always reachable.
  // As wide as the phone allows, up to 320px, and always 16px clear of both edges.
  const tipWidth = Math.min(320, window.innerWidth - 32);
  const tipTop = (() => {
    if (!targetRect) return 0;
    const gap = PADDING + 12;
    const edge = 16;
    const below = targetRect.bottom + gap;
    const above = targetRect.top - gap - tipHeight;
    const fitsBelow = below + tipHeight <= window.innerHeight - edge;
    const fitsAbove = above >= edge;
    if (pos === "below" ? fitsBelow : fitsAbove) return pos === "below" ? below : above;
    if (pos === "below" ? fitsAbove : fitsBelow) return pos === "below" ? above : below;
    return Math.max(edge, window.innerHeight - edge - tipHeight);
  })();

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-label={`${tourKey} walkthrough`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onComplete();
      }}
    >
      {/* Dark overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id={`tour-mask-${tourKey}`}>
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - PADDING}
                y={targetRect.top - PADDING}
                width={targetRect.width + PADDING * 2}
                height={targetRect.height + PADDING * 2}
                rx={12}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask={`url(#tour-mask-${tourKey})`}
          style={{ pointerEvents: "auto" }}
          onClick={(e) => e.stopPropagation()}
        />
      </svg>

      {/* Spotlight ring */}
      {targetRect && (
        <div
          className="absolute border-2 border-primary rounded-xl pointer-events-none"
          style={{
            left: targetRect.left - PADDING,
            top: targetRect.top - PADDING,
            width: targetRect.width + PADDING * 2,
            height: targetRect.height + PADDING * 2,
          }}
          aria-hidden="true"
        />
      )}

      {/* Skip button */}
      <button
        onClick={onComplete}
        className="absolute top-2 right-2 z-[101] min-h-[44px] rounded-lg px-4 text-sm font-bold text-white/85 hover:text-white"
      >
        Skip
      </button>

      {/* Tooltip */}
      {targetRect && (
        <div
          ref={tooltipRef}
          tabIndex={-1}
          role="status"
          aria-live="polite"
          className={cn(
            "absolute z-[101] bg-card rounded-xl shadow-xl p-4 border border-border transition-opacity duration-150",
            transitioning ? "opacity-0" : "opacity-100",
            !prefersReducedMotion && !transitioning && "animate-fade-in"
          )}
          style={{
            width: tipWidth,
            left: Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - tipWidth / 2, window.innerWidth - tipWidth - 16)),
            top: tipTop,
          }}
        >
          <div className="flex items-center gap-3 mb-2"><GuideArt name="guide-waving" size={48} /><h3 className="font-semibold text-sm">{step.title}</h3></div>
          <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === currentStep ? "w-4 bg-primary" : "w-1.5 bg-muted"
                  )}
                />
              ))}
            </div>
            <Button size="sm" onClick={handleNext} className="min-h-[44px] px-5 text-sm font-bold">
              {isLast ? "Got it!" : "Next"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
