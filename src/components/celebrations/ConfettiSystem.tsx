import { useEffect, useState, useMemo } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type ConfettiIntensity = "light" | "medium" | "heavy" | "epic";

interface ConfettiSystemProps {
  intensity: ConfettiIntensity;
  colors?: string[];
  duration?: number;
  particleCount?: number;
  trigger: number; // increment to fire
}

const DEFAULT_COLORS = ["#7C3AED", "#EC4899", "#F59E0B", "#10B981", "#FFFFFF"];
const INTENSITY_DEFAULTS: Record<ConfettiIntensity, number> = {
  light: 18,
  medium: 65,
  heavy: 125,
  epic: 220,
};

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  driftX: number;
  delay: number;
  duration: number;
  shape: "square" | "circle" | "rect";
}

function pickWeightedColor(colors: string[]): string {
  // 40% purple, 30% pink, 15% gold, 10% green, 5% white
  const weights = [0.4, 0.3, 0.15, 0.1, 0.05];
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < Math.min(colors.length, weights.length); i++) {
    cumulative += weights[i];
    if (r < cumulative) return colors[i];
  }
  return colors[0];
}

export const ConfettiSystem = ({
  intensity,
  colors = DEFAULT_COLORS,
  duration = 2500,
  particleCount,
  trigger,
}: ConfettiSystemProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [particles, setParticles] = useState<Particle[]>([]);

  const count = particleCount ?? INTENSITY_DEFAULTS[intensity];

  useEffect(() => {
    if (trigger === 0) return;
    if (prefersReducedMotion) {
      setParticles([]);
      return;
    }

    const shapes: Particle["shape"][] = ["square", "circle", "rect"];
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: intensity === "light" ? 20 + Math.random() * 60 : Math.random() * 100,
      y: intensity === "light" || intensity === "medium" ? -5 : 40 + Math.random() * 20,
      color: pickWeightedColor(colors),
      size: intensity === "light" ? 4 + Math.random() * 4 : 4 + Math.random() * 8,
      rotation: Math.random() * 360,
      driftX: -100 + Math.random() * 200,
      delay: Math.random() * (intensity === "epic" ? 0.8 : 0.5),
      duration: (duration / 1000) * (0.7 + Math.random() * 0.6),
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    }));

    setParticles(newParticles);
    const timer = setTimeout(() => setParticles([]), duration + 500);
    return () => clearTimeout(timer);
  }, [trigger, prefersReducedMotion]);

  if (prefersReducedMotion && trigger > 0) {
    return (
      <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center" aria-hidden="true">
        <span className="text-4xl animate-bounce-in">✨ Achievement!</span>
      </div>
    );
  }

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.shape === "rect" ? p.size * 1.5 : p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : p.shape === "rect" ? "2px" : "1px",
            transform: `rotate(${p.rotation}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            "--drift-x": `${p.driftX}px`,
          } as React.CSSProperties}
        />
      ))}

      {/* Epic tier: rising gold sparkles */}
      {intensity === "epic" && (
        <>
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute animate-sparkle-rise"
              style={{
                left: `${5 + Math.random() * 90}%`,
                bottom: "-10px",
                width: 3 + Math.random() * 4,
                height: 3 + Math.random() * 4,
                backgroundColor: "#F59E0B",
                borderRadius: "50%",
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                boxShadow: "0 0 6px 2px rgba(245, 158, 11, 0.5)",
              }}
            />
          ))}
        </>
      )}
    </div>
  );
};
