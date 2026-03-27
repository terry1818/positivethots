import { useEffect, useState } from "react";

interface PhaseInterstitialProps {
  show: boolean;
  emoji: string;
  message: string;
  nextPhase: string;
  nextUp?: string;
  onComplete: () => void;
}

export const PhaseInterstitial = ({ show, emoji, message, nextPhase, nextUp, onComplete }: PhaseInterstitialProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onComplete, 300);
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!show && !visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={() => { setVisible(false); setTimeout(onComplete, 100); }}
    >
      <span className="text-7xl animate-bounce-in mb-6">{emoji}</span>
      <p className="text-lg text-muted-foreground mb-2 animate-stagger-1">{message}</p>
      <p className="text-2xl font-bold text-foreground animate-stagger-2">
        {nextPhase}
      </p>
      {nextUp && (
        <p className="text-sm text-muted-foreground mt-2 animate-stagger-3">{nextUp}</p>
      )}
      <p className="text-xs text-muted-foreground mt-6 animate-stagger-3">Tap to continue</p>
    </div>
  );
};
