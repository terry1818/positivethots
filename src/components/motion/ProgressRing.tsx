import type { ReactNode } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function ProgressRing({ size = 96, strokeWidth = 8, percent, children }: {
  size?: number; strokeWidth?: number; percent: number; children?: ReactNode;
}) {
  const reduced = useReducedMotion();
  const value = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  const radius = Math.max(0, (size - strokeWidth) / 2);
  const circumference = 2 * Math.PI * radius;
  return <div className="relative inline-grid place-items-center shrink-0" style={{ width: size, height: size }} role="progressbar" aria-label="Learning progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value / 100)} className={reduced ? "text-primary" : "text-primary transition-[stroke-dashoffset] duration-500"} />
    </svg>
    <div className="relative">{children}</div>
  </div>;
}