import { useEffect, useState } from "react";

interface XPPopupProps {
  amount: number;
  show: boolean;
  onDone: () => void;
}

export const XPPopup = ({ amount, show, onDone }: XPPopupProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onDone();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [show, onDone]);

  if (!visible) return null;

  return (
    <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-xp-float">
      <div className="bg-accent text-accent-foreground font-bold text-2xl px-6 py-3 rounded-full shadow-lg">
        +{amount} XP ⚡
      </div>
    </div>
  );
};
