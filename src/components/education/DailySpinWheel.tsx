import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

interface SpinReward {
  label: string;
  emoji: string;
  type: "xp" | "thot" | "boost" | "freeze" | "hint";
  value: number;
  rarity: "common" | "uncommon" | "rare" | "very_rare";
}

const REWARDS: SpinReward[] = [
  { label: "+5 XP", emoji: "⚡", type: "xp", value: 5, rarity: "common" },
  { label: "+10 XP", emoji: "⚡", type: "xp", value: 10, rarity: "common" },
  { label: "+5 XP", emoji: "⚡", type: "xp", value: 5, rarity: "common" },
  { label: "+25 XP", emoji: "🌟", type: "xp", value: 25, rarity: "uncommon" },
  { label: "Badge Hint", emoji: "🔮", type: "hint", value: 1, rarity: "uncommon" },
  { label: "+50 XP", emoji: "💎", type: "xp", value: 50, rarity: "rare" },
  { label: "+1 Thot", emoji: "💜", type: "thot", value: 1, rarity: "rare" },
  { label: "Streak Freeze", emoji: "❄️", type: "freeze", value: 1, rarity: "very_rare" },
];

// Weighted selection: common 60%, uncommon 25%, rare 12%, very_rare 3%
const WEIGHTS: Record<string, number> = { common: 60, uncommon: 25, rare: 12, very_rare: 3 };

function pickReward(): { index: number; reward: SpinReward } {
  const byRarity: Record<string, number[]> = {};
  REWARDS.forEach((r, i) => {
    if (!byRarity[r.rarity]) byRarity[r.rarity] = [];
    byRarity[r.rarity].push(i);
  });

  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const rarity of ["common", "uncommon", "rare", "very_rare"]) {
    cumulative += WEIGHTS[rarity];
    if (roll < cumulative && byRarity[rarity]?.length) {
      const idx = byRarity[rarity][Math.floor(Math.random() * byRarity[rarity].length)];
      return { index: idx, reward: REWARDS[idx] };
    }
  }
  return { index: 0, reward: REWARDS[0] };
}

const SEGMENT_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--primary) / 0.7)",
  "hsl(var(--secondary) / 0.7)",
  "hsl(var(--accent) / 0.7)",
  "hsl(var(--primary) / 0.5)",
  "hsl(var(--secondary) / 0.5)",
];

interface DailySpinWheelProps {
  onReward: (reward: SpinReward) => void;
  hasSpunToday: boolean;
}

export const DailySpinWheel = ({ onReward, hasSpunToday }: DailySpinWheelProps) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinReward | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const spin = useCallback(async () => {
    if (spinning || hasSpunToday) return;
    setSpinning(true);
    setResult(null);

    const { index, reward } = pickReward();
    const segmentAngle = 360 / REWARDS.length;
    // Calculate final rotation so the pointer (at top) lands on the winning segment
    const targetAngle = 360 - (index * segmentAngle + segmentAngle / 2);
    const totalRotation = 360 * 5 + targetAngle; // 5 full spins + target

    setRotation(prev => prev + totalRotation);

    const spinDuration = reducedMotion ? 500 : 2500;
    setTimeout(async () => {
      setResult(reward);
      setSpinning(false);

      if (reward.rarity === "rare" || reward.rarity === "very_rare") {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      }

      // Persist spin to DB
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").update({
            last_daily_spin: new Date().toISOString().split("T")[0],
          } as any).eq("id", user.id);
        }
      } catch {}

      trackEvent("daily_spin_result", {
        reward_label: reward.label,
        reward_type: reward.type,
        reward_rarity: reward.rarity,
        reward_value: reward.value,
      });

      onReward(reward);
    }, spinDuration);
  }, [spinning, hasSpunToday, onReward, reducedMotion]);

  if (hasSpunToday && !result) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="p-3 text-center">
          <p className="text-sm text-muted-foreground">🎰 Come back tomorrow for another spin!</p>
        </CardContent>
      </Card>
    );
  }

  const segmentAngle = 360 / REWARDS.length;

  return (
    <Card className="animate-fade-in overflow-hidden">
      <CardContent className="p-3">
        <div className="flex flex-col items-center gap-2">
          {/* Wheel */}
          <div className="relative w-48 h-48">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 text-xl">▼</div>

            {/* Spinning wheel */}
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning
                  ? `transform ${reducedMotion ? 0.5 : 2.5}s cubic-bezier(0.17, 0.67, 0.12, 0.99)`
                  : "none",
              }}
            >
              {REWARDS.map((reward, i) => {
                const startAngle = (i * segmentAngle - 90) * (Math.PI / 180);
                const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180);
                const x1 = 100 + 95 * Math.cos(startAngle);
                const y1 = 100 + 95 * Math.sin(startAngle);
                const x2 = 100 + 95 * Math.cos(endAngle);
                const y2 = 100 + 95 * Math.sin(endAngle);
                const largeArc = segmentAngle > 180 ? 1 : 0;
                const midAngle = ((i + 0.5) * segmentAngle - 90) * (Math.PI / 180);
                const textX = 100 + 60 * Math.cos(midAngle);
                const textY = 100 + 60 * Math.sin(midAngle);
                const textRotation = (i + 0.5) * segmentAngle;

                return (
                  <g key={i}>
                    <path
                      d={`M100,100 L${x1},${y1} A95,95 0 ${largeArc},1 ${x2},${y2} Z`}
                      fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
                      stroke="hsl(var(--border))"
                      strokeWidth="0.5"
                    />
                    <text
                      x={textX}
                      y={textY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="9"
                      fill="white"
                      fontWeight="bold"
                      transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                    >
                      {reward.emoji}
                    </text>
                  </g>
                );
              })}
              <circle cx="100" cy="100" r="15" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" />
            </svg>

            {/* Confetti overlay */}
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none animate-fade-in">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span
                    key={i}
                    className="absolute text-lg animate-bounce"
                    style={{
                      left: `${Math.random() * 80 + 10}%`,
                      top: `${Math.random() * 80 + 10}%`,
                      animationDelay: `${i * 100}ms`,
                    }}
                  >
                    {["🎉", "✨", "💜", "⭐"][i % 4]}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className="text-center animate-scale-in">
              <p className="text-base font-bold">{result.emoji} {result.label}!</p>
              <p className="text-sm text-muted-foreground">
                {result.rarity === "rare" || result.rarity === "very_rare" ? "Lucky spin! 🍀" : "Nice!"}
              </p>
            </div>
          )}

          {/* Spin button */}
          {!result && (
            <Button
              onClick={spin}
              disabled={spinning || hasSpunToday}
              className={cn(
                "w-full",
                !spinning && !hasSpunToday && "animate-pulse"
              )}
            >
              {spinning ? "Spinning..." : "🎰 Spin to Win!"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
