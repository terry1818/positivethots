import { useEffect, useState } from "react";

interface XPPopupProps {
  amount: number;
  show: boolean;
  onDone: () => void;
}

export const XPPopup = ({ amount, show, onDone }: XPPopupProps) => {
  const [visible, setVisible] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setShowFlash(true);
      
      const flashTimer = setTimeout(() => setShowFlash(false), 400);
      const hideTimer = setTimeout(() => {
        setVisible(false);
        onDone();
      }, 1500);
      
      return () => { clearTimeout(flashTimer); clearTimeout(hideTimer); };
    }
  }, [show, onDone]);

  if (!visible) return null;

  const isLarge = amount >= 50;

  return (
    <>
      {/* Screen flash overlay */}
      {showFlash && (
        <div className="fixed inset-0 z-[60] pointer-events-none bg-accent/20 animate-screen-flash" />
      )}
      
      {/* XP popup */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-xp-float">
        <div className={cn(
          "bg-accent text-accent-foreground font-bold rounded-full shadow-lg flex items-center gap-1",
          isLarge ? "text-3xl px-8 py-4" : "text-2xl px-6 py-3"
        )}>
          +{amount} XP ⚡
        </div>
        
        {/* Particle burst */}
        {isLarge && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 bg-accent rounded-full animate-emoji-burst"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `rotate(${i * 45}deg) translateY(-20px)`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

// Need cn import
import { cn } from "@/lib/utils";
