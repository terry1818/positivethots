import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { spring } from "@/lib/motionTokens";
export const QuizCombo = ({ combo }: { combo: number }) => {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState<number | null>(null);
  useEffect(() => {
    if (![3, 5, 10].includes(combo)) { if (combo === 0) setShown(null); return; }
    setShown(combo); const timer = setTimeout(() => setShown(null), 1500);
    return () => clearTimeout(timer);
  }, [combo]);
  return <><p className="sr-only" aria-live="polite">{shown ? `${shown} in a row` : ""}</p><AnimatePresence>{shown && <m.span key={shown} aria-hidden className="absolute -top-7 right-0 text-sm font-bold text-primary"
    initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8 }} animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={reduced ? { duration: 0.1 } : { type: "spring", ...spring.pop }}>{shown} in a row</m.span>}</AnimatePresence></>;
};
