import { useEffect, useRef, useState, memo } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface AnimatedCounterProps {
  end: number;
  start?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedCounter = memo(({ end, start = 0, duration = 1000, prefix = "", suffix = "", className = "" }: AnimatedCounterProps) => {
  const [count, setCount] = useState(start);
  const reduced = useReducedMotion();
  const startTime = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (reduced || duration <= 0) {
      setCount(end);
      return;
    }

    startTime.current = null;
    setCount(start);
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(start + eased * (end - start)));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [end, start, duration, reduced]);

  return <span className={`tabular-nums ${className}`}>{prefix}{reduced ? end : count}{suffix}</span>;
});

AnimatedCounter.displayName = "AnimatedCounter";
