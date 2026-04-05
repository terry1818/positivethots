import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface RotatingTaglineProps {
  lines: string[];
  interval?: number;
  variant?: "primary" | "secondary" | "muted";
  className?: string;
}

const variantStyles = {
  primary: "text-primary text-base",
  secondary: "text-[rgba(255,255,255,0.7)] text-sm",
  muted: "text-[rgba(255,255,255,0.5)] text-xs",
} as const;

export const RotatingTagline = ({
  lines,
  interval = 4000,
  variant = "secondary",
  className,
}: RotatingTaglineProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [containerHeight, setContainerHeight] = useState<number>(48);
  const measureRef = useRef<HTMLDivElement>(null);
  const isDocVisible = useRef(true);

  // Measure tallest line
  useEffect(() => {
    if (measureRef.current) {
      const children = measureRef.current.children;
      let maxH = 48;
      for (let i = 0; i < children.length; i++) {
        const h = (children[i] as HTMLElement).offsetHeight;
        if (h > maxH) maxH = h;
      }
      setContainerHeight(maxH);
    }
  }, [lines]);

  // Pause on tab hidden
  useEffect(() => {
    const handler = () => { isDocVisible.current = !document.hidden; };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  // Rotation
  useEffect(() => {
    if (prefersReducedMotion || lines.length <= 1) return;
    const timer = setInterval(() => {
      if (!isDocVisible.current) return;
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex(i => (i + 1) % lines.length);
        setIsVisible(true);
      }, 300);
    }, interval);
    return () => clearInterval(timer);
  }, [interval, lines.length, prefersReducedMotion]);

  const renderTMLine = useCallback((line: string) => {
    // Find "Thots" and add TM after it
    const parts = line.split(/(Thots\.?)/);
    return parts.map((part, i) => {
      if (/^Thots\.?$/.test(part)) {
        return (
          <span key={i}>
            {part}
            <sup className="opacity-70" style={{ fontSize: "60%", verticalAlign: "super" }}>TM</sup>
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }, []);

  // Reduced motion: show first line only (static)
  if (prefersReducedMotion) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn("text-center px-4", variantStyles[variant], className)}
        style={{ fontFamily: "Inter, system-ui, sans-serif", minHeight: 48 }}
      >
        <p className="font-normal not-italic leading-relaxed">
          {renderTMLine(lines[0])}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Hidden measurer */}
      <div
        ref={measureRef}
        className="absolute opacity-0 pointer-events-none"
        style={{ width: "100%", maxWidth: "inherit" }}
        aria-hidden="true"
      >
        {lines.map((line, i) => (
          <p key={i} className={cn("font-normal leading-relaxed px-4 text-center", variantStyles[variant])}>
            {line}
          </p>
        ))}
      </div>

      <div
        role="status"
        aria-live="polite"
        className={cn("relative text-center px-4 overflow-hidden", className)}
        style={{ fontFamily: "Inter, system-ui, sans-serif", height: containerHeight, minHeight: 48 }}
      >
        <p
          className={cn(
            "font-normal not-italic leading-relaxed transition-opacity duration-300",
            variantStyles[variant],
            isVisible ? "opacity-100" : "opacity-0"
          )}
        >
          {renderTMLine(lines[currentIndex])}
        </p>
      </div>
    </>
  );
};
