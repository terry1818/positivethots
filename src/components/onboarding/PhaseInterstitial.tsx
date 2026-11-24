import { useEffect, useRef } from "react";
import { GuideArt } from "@/components/mascot/GuideArt";
import { Button } from "@/components/ui/button";

interface PhaseInterstitialProps {
  show: boolean;
  /** Kept so callers do not change; the guide art takes its place on screen. */
  emoji?: string;
  message: string;
  nextPhase: string;
  nextUp?: string;
  onComplete: () => void;
}

/** The pause between two sections of onboarding. It waits for the member: nothing moves on by itself. */
export const PhaseInterstitial = ({ show, message, nextPhase, nextUp, onComplete }: PhaseInterstitialProps) => {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (show) button.current?.focus(); }, [show]);
  if (!show) return null;

  return (
    <div className="kit-area-learn kit-entry fixed inset-0 z-50 bg-background" role="dialog" aria-modal="true" aria-labelledby="phase-next">
      <div className="kit-entry-column kit-pop text-center">
        <div className="kit-panel h-[190px]"><div className="pb-2"><GuideArt name="guide-high-five" size={160} /></div></div>
        <p className="mt-5 text-muted-foreground [text-wrap:pretty]">{message}</p>
        <h2 id="phase-next" className="mt-1 text-2xl font-extrabold [text-wrap:balance]">{nextPhase}</h2>
        {nextUp && <p className="mt-1 text-sm text-muted-foreground [text-wrap:pretty]">{nextUp}</p>}
        <Button ref={button} className="kit-cta mt-6 w-full" onClick={onComplete}>Continue</Button>
      </div>
    </div>
  );
};
