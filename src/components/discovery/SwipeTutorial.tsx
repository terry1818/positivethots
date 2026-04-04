import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "pt_swipe_tutorial_seen";

interface SwipeTutorialProps {
  onDismiss: () => void;
}

export const SwipeTutorial = ({ onDismiss }: SwipeTutorialProps) => {
  const [phase, setPhase] = useState(0); // 0=left, 1=right, 2=up
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const interval = setInterval(() => {
      setPhase(p => {
        if (p >= 2) return p; // stop at last
        return p + 1;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => handleDismiss(), 6000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    onDismiss();
  };

  const gestures = [
    { icon: ArrowLeft, label: "Pass", color: "text-muted-foreground" },
    { icon: ArrowRight, label: "Connect", color: "text-success" },
    { icon: ArrowUp, label: "Send a Thot", color: "text-primary" },
  ];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center" onClick={handleDismiss}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 flex flex-col items-center gap-8 p-8">
        {prefersReducedMotion ? (
          // Static layout for reduced motion
          <div className="flex gap-8">
            {gestures.map((g, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <g.icon className={cn("h-10 w-10", g.color)} />
                <span className={cn("text-sm font-semibold", g.color)}>{g.label}</span>
              </div>
            ))}
          </div>
        ) : (
          // Animated sequence
          <div className="flex flex-col items-center gap-4">
            {gestures.map((g, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 transition-all duration-500",
                  phase >= i ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
              >
                <g.icon className={cn("h-8 w-8", g.color, phase === i && "animate-bounce")} />
                <span className={cn("text-lg font-semibold text-white")}>{g.label}</span>
              </div>
            ))}
          </div>
        )}

        <Button
          size="sm"
          onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
          className="mt-4"
        >
          Got it!
        </Button>
      </div>
    </div>
  );
};

export const shouldShowSwipeTutorial = (): boolean => {
  if (typeof window === "undefined") return false;
  if (window.innerWidth >= 768) return false; // desktop only
  return !localStorage.getItem(STORAGE_KEY);
};
