import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    target: "discovery-card",
    title: "Your first match suggestion!",
    description: "Tap to see their full profile.",
    position: "bottom" as const,
  },
  {
    target: "compatibility-score",
    title: "Compatibility Score",
    description: "This shows how compatible you are based on shared values and education progress.",
    position: "bottom" as const,
  },
  {
    target: "action-buttons",
    title: "Pass, Connect, or Send a Thot",
    description: "Pass, Connect, or Send a Thot — our version of a Super Like!",
    position: "top" as const,
  },
  {
    target: "bottom-nav",
    title: "Explore the app",
    description: "Check your Likes, Learn modules, Messages, and Profile here. Have fun! 💜",
    position: "top" as const,
  },
];

const STORAGE_KEY = "pt_discovery_walkthrough_seen";

interface DiscoveryWalkthroughProps {
  onComplete: () => void;
}

export const DiscoveryWalkthrough = ({ onComplete }: DiscoveryWalkthroughProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updateTargetRect = useCallback(() => {
    const step = STEPS[currentStep];
    const el = document.querySelector(`[data-walkthrough="${step.target}"]`);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    }
  }, [currentStep]);

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

  const handleNext = () => {
    if (currentStep >= STEPS.length - 1) {
      handleComplete();
    } else {
      setCurrentStep(s => s + 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    onComplete();
  };

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const padding = 8;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-label="Discovery walkthrough">
      {/* Semi-transparent backdrop with cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="walkthrough-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
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
          mask="url(#walkthrough-mask)"
          style={{ pointerEvents: "auto" }}
          onClick={(e) => e.stopPropagation()}
        />
      </svg>

      {/* Spotlight ring */}
      {targetRect && (
        <div
          className="absolute border-2 border-primary rounded-xl pointer-events-none"
          style={{
            left: targetRect.left - padding,
            top: targetRect.top - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
          }}
          aria-hidden="true"
        />
      )}

      {/* Skip button */}
      <button
        onClick={handleComplete}
        className="absolute top-4 right-4 text-sm text-white/70 hover:text-white z-[101]"
      >
        Skip walkthrough
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
            left: Math.max(16, Math.min(
              targetRect.left + targetRect.width / 2 - 144,
              window.innerWidth - 288 - 16
            )),
            ...(step.position === "bottom"
              ? { top: targetRect.bottom + padding + 12 }
              : { bottom: window.innerHeight - targetRect.top + padding + 12 }
            ),
          }}
        >
          <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
          <p className="text-xs text-muted-foreground mb-3">{step.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === currentStep ? "w-4 bg-primary" : "w-1.5 bg-muted"
                  )}
                />
              ))}
            </div>
            <Button size="sm" onClick={handleNext} className="h-8 text-xs">
              {isLast ? "Got it!" : "Next"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const shouldShowWalkthrough = (): boolean => {
  return !localStorage.getItem(STORAGE_KEY);
};
