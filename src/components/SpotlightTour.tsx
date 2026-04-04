import { useState, useEffect, useCallback, useRef } from "react";
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
  const prefersReducedMotion = useReducedMotion();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updateTargetRect = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return;
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [currentStep, steps]);

  useEffect(() => {
    updateTargetRect();
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect);
    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect);
    };
  }, [updateTargetRect]);

  useEffect(() => {
    tooltipRef.current?.focus();
  }, [currentStep]);

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
      setCurrentStep((s) => s + 1);
    }
  };

  const step = steps[currentStep];
  if (!step) return null;

  const isLast = currentStep === steps.length - 1;
  const pos = step.position || "below";

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-label={`${tourKey} walkthrough`}
      onClick={(e) => {
        // Dismiss on backdrop click
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
        className="absolute top-4 right-4 text-sm text-white/70 hover:text-white z-[101]"
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
            "absolute z-[101] w-72 bg-card rounded-xl shadow-xl p-4 border border-border",
            !prefersReducedMotion && "animate-fade-in"
          )}
          style={{
            left: Math.max(
              16,
              Math.min(
                targetRect.left + targetRect.width / 2 - 144,
                window.innerWidth - 288 - 16
              )
            ),
            ...(pos === "below"
              ? { top: targetRect.bottom + PADDING + 12 }
              : { bottom: window.innerHeight - targetRect.top + PADDING + 12 }),
          }}
        >
          <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
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
            <Button size="sm" onClick={handleNext} className="h-8 text-sm">
              {isLast ? "Got it!" : "Next"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
