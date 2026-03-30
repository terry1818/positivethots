import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface MicroCelebrationProps {
  trigger: number; // increment to trigger
  emojis?: string[];
}

export const MicroCelebration = ({ trigger, emojis = ["✨", "💜", "🔥", "⭐", "💫"] }: MicroCelebrationProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [particles, setParticles] = useState<{ id: number; emoji: string; x: number; delay: number }[]>([]);
  const [staticFlash, setStaticFlash] = useState(false);

  useEffect(() => {
    if (trigger === 0) return;
    if (prefersReducedMotion) {
      setStaticFlash(true);
      const timer = setTimeout(() => setStaticFlash(false), 600);
      return () => clearTimeout(timer);
    }
    const newParticles = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      x: 30 + Math.random() * 40,
      delay: Math.random() * 0.3,
    }));
    setParticles(newParticles);
    const timer = setTimeout(() => setParticles([]), 1200);
    return () => clearTimeout(timer);
  }, [trigger]);

  if (staticFlash) {
    return (
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
        <span className="text-4xl">✨</span>
      </div>
    );
  }

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute text-2xl animate-emoji-burst"
          style={{
            left: `${p.x}%`,
            bottom: "30%",
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
};
