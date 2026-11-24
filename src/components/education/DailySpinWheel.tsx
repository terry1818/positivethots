import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import { Zap, Star, Lightbulb, Gem, Heart, Snowflake, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GuideArt, type GuideName } from "@/components/mascot/GuideArt";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { landingRotation, spinTravel } from "@/lib/spinWheel";

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

// One look per wedge, in REWARDS order. Neighbours never share a hue; bright wedges carry dark ink.
const INK = "hsl(var(--art-ink))";
const WEDGES: { fill: string; ink: string; icon: LucideIcon; lines: [string, string]; tone: string }[] = [
  { fill: "hsl(var(--path-foundation-top))", ink: "#fff", icon: Zap, lines: ["+5", "XP"], tone: "area" },
  { fill: "hsl(var(--art-info))", ink: INK, icon: Zap, lines: ["+10", "XP"], tone: "info" },
  { fill: "hsl(var(--kit-discover-top))", ink: "#fff", icon: Zap, lines: ["+5", "XP"], tone: "pink" },
  { fill: "hsl(var(--art-correct))", ink: INK, icon: Star, lines: ["+25", "XP"], tone: "correct" },
  { fill: "hsl(var(--path-identity-top))", ink: "#fff", icon: Lightbulb, lines: ["Badge", "Hint"], tone: "area" },
  { fill: "hsl(var(--art-reward))", ink: INK, icon: Gem, lines: ["+50", "XP"], tone: "reward" },
  { fill: "hsl(245 70% 50%)", ink: "#fff", icon: Heart, lines: ["+1", "Thot"], tone: "pink" },
  { fill: "hsl(195 95% 88%)", ink: INK, icon: Snowflake, lines: ["Streak", "Freeze"], tone: "info" },
];

const WIN_COPY: Record<SpinReward["rarity"], { line: string; guide: GuideName }> = {
  common: { line: "Nice spin!", guide: "guide-high-five" },
  uncommon: { line: "Good one!", guide: "guide-high-five" },
  rare: { line: "Lucky spin!", guide: "guide-chest-open" },
  very_rare: { line: "The rarest prize on the wheel!", guide: "guide-trophy" },
};

const SEG = 360 / REWARDS.length;
const C = 150;
const R = 124;
const SPIN_MS = 4600;
const BURST_COLORS = ["var(--art-reward)", "var(--art-info)", "var(--art-correct)", "var(--art-urgent)", "var(--kit-discover-top)"];

/** Point on the wheel at `deg` clockwise from the top. */
const at = (deg: number, radius: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [C + radius * Math.cos(rad), C + radius * Math.sin(rad)] as const;
};
const [wx1, wy1] = at(-SEG / 2, R);
const [wx2, wy2] = at(SEG / 2, R);
const WEDGE_PATH = `M${C},${C} L${wx1.toFixed(2)},${wy1.toFixed(2)} A${R},${R} 0 0,1 ${wx2.toFixed(2)},${wy2.toFixed(2)} Z`;

type Phase = "ready" | "spinning" | "saving" | "won";

interface DailySpinWheelProps {
  /** Saves the prize. Resolves false when nothing was saved, true when it was, or the XP actually added (bonuses included). */
  onReward: (reward: SpinReward) => Promise<boolean | number>;
  hasSpunToday: boolean;
}

export const DailySpinWheel = ({ onReward, hasSpunToday }: DailySpinWheelProps) => {
  const [phase, setPhase] = useState<Phase>("ready");
  const [result, setResult] = useState<SpinReward | null>(null);
  const [winIndex, setWinIndex] = useState<number | null>(null);
  const [missed, setMissed] = useState(false);
  const [wonLabel, setWonLabel] = useState("");
  const reducedMotion = useReducedMotion();
  const { playSpinStart, playSpinTick, playSpinWin } = useSoundEffects();
  const discRef = useRef<SVGGElement>(null);
  const pointerRef = useRef<SVGGElement>(null);
  // Rest with a wedge centred under the pointer, not a seam.
  const rotation = useRef(landingRotation(0, REWARDS.length));
  const frame = useRef(0);
  const flick = useRef(0);

  useEffect(() => () => { cancelAnimationFrame(frame.current); window.clearTimeout(flick.current); }, []);

  const turnTo = (deg: number) => {
    rotation.current = deg;
    if (discRef.current) discRef.current.style.transform = `rotate(${deg}deg)`;
  };

  const spin = useCallback(() => {
    if (phase !== "ready" || hasSpunToday) return;
    setPhase("spinning");
    setResult(null);
    setMissed(false);
    setWinIndex(null);

    const { index, reward } = pickReward();
    // The pointer sits at the top. Land somewhere inside the winning wedge, not always dead centre.
    const within = (Math.random() - 0.5) * (SEG - 16);
    const start = rotation.current % 360;
    const total = spinTravel(start, landingRotation(index, REWARDS.length, within));
    const duration = reducedMotion ? 300 : SPIN_MS;

    playSpinStart();
    if (reducedMotion) {
      turnTo(start + total);
    } else {
      const t0 = performance.now();
      let lastWedge = Math.floor(start / SEG);
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - t, 3.4);
        const angle = start + total * eased;
        turnTo(angle);
        const wedge = Math.floor(angle / SEG);
        if (wedge !== lastWedge) {
          lastWedge = wedge;
          playSpinTick(t);
          // The pointer is knocked aside by each peg and springs back.
          const pointer = pointerRef.current;
          if (pointer) {
            pointer.dataset.flick = "true";
            window.clearTimeout(flick.current);
            flick.current = window.setTimeout(() => { pointer.dataset.flick = "false"; }, 40);
          }
        }
        if (t < 1) frame.current = requestAnimationFrame(step);
      };
      frame.current = requestAnimationFrame(step);
    }

    // The prize is saved on a timer of its own, so it still lands if the sheet is closed mid-spin.
    window.setTimeout(async () => {
      setWinIndex(index);
      setPhase("saving");
      const awarded = await onReward(reward);

      if (awarded) {
        setWonLabel(typeof awarded === "number" ? `+${awarded} XP` : reward.label);
        setResult(reward);
        setPhase("won");
        playSpinWin(reward.rarity);
        // Persist spin to DB
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from("profiles").update({
              last_daily_spin: new Date().toISOString().split("T")[0],
            } as any).eq("id", user.id);
          }
        } catch {}
      } else {
        // Nothing was saved, so the spin is handed back.
        setMissed(true);
        setWinIndex(null);
        setPhase("ready");
      }

      trackEvent("daily_spin_result", {
        reward_label: reward.label,
        reward_type: reward.type,
        reward_rarity: reward.rarity,
        reward_value: reward.value,
      });
    }, duration + (reducedMotion ? 0 : 350));
  }, [phase, hasSpunToday, onReward, reducedMotion, playSpinStart, playSpinTick, playSpinWin]);

  const burst = useMemo(() => {
    if (!result) return [];
    const count = result.rarity === "common" ? 14 : result.rarity === "uncommon" ? 18 : 28;
    return Array.from({ length: count }, (_, i) => ({
      angle: (360 / count) * i + (i % 2 ? 9 : 0),
      distance: 120 + ((i * 37) % 60),
      color: BURST_COLORS[i % BURST_COLORS.length],
      delay: (i % 4) * 40,
    }));
  }, [result]);

  if (hasSpunToday && phase === "ready") {
    return (
      <div className="flex flex-col items-center text-center pb-2">
        <div className="kit-panel kit-rise w-full max-w-[300px] h-[176px]">
          <GuideArt name="guide-sleepy" size={160} />
        </div>
        <p className="kit-rise mt-4 text-lg font-extrabold" style={{ "--i": 1 } as CSSProperties}>You've had today's spin</p>
        <p className="kit-rise text-base text-muted-foreground" style={{ "--i": 2 } as CSSProperties}>Come back tomorrow for another one.</p>
      </div>
    );
  }

  const won = phase === "won" && result;
  const winLook = winIndex !== null ? WEDGES[winIndex] : null;

  return (
    <div className="flex flex-col items-center gap-4 pb-2">
      <div className="spin-stage" data-phase={phase}>
        <svg
          viewBox="0 0 300 300"
          className="spin-wheel-svg"
          role="img"
          aria-label={`Prize wheel. Prizes: ${[...new Set(REWARDS.map(r => r.label))].join(", ")}.`}
        >
          <defs>
            <linearGradient id="spin-rim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="hsl(45 100% 66%)" />
              <stop offset="1" stopColor="hsl(var(--path-gold))" />
            </linearGradient>
            <radialGradient id="spin-sheen" cx="50%" cy="30%" r="75%">
              <stop offset="0" stopColor="#fff" stopOpacity=".28" />
              <stop offset=".6" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="spin-hub" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="hsl(var(--path-foundation-top))" />
              <stop offset="1" stopColor="hsl(var(--path-foundation-bottom))" />
            </linearGradient>
          </defs>

          {/* Brass rim with a ring of lights */}
          <circle cx={C} cy={C} r="147" fill="hsl(var(--path-gold-dark))" />
          <circle cx={C} cy={C} r="144" fill="url(#spin-rim)" />
          <circle cx={C} cy={C} r={R + 3} fill="hsl(var(--path-gold-dark))" />
          <g aria-hidden="true">
            {Array.from({ length: 16 }, (_, i) => {
              const [x, y] = at(i * 22.5 + 11.25, 135.5);
              return <circle key={i} className="spin-light" cx={x} cy={y} r="4.2" />;
            })}
          </g>

          {/* The part that turns */}
          <g ref={discRef} className="spin-disc" style={{ transform: `rotate(${rotation.current}deg)` }}>
            {REWARDS.map((reward, i) => {
              const look = WEDGES[i];
              const Icon = look.icon;
              const long = look.lines[0].length > 3;
              return (
                <g key={i} className="spin-wedge" data-win={winIndex === i} transform={`rotate(${(i + 0.5) * SEG} ${C} ${C})`}>
                  <path d={WEDGE_PATH} fill={look.fill} stroke="hsl(var(--path-gold-dark))" strokeWidth="2" strokeLinejoin="round" />
                  <text x={C} y={C - 92} textAnchor="middle" fontSize={long ? 15 : 23} fontWeight="900" fill={look.ink}>{look.lines[0]}</text>
                  <text x={C} y={C - 76} textAnchor="middle" fontSize={long ? 15 : 13} fontWeight="900" fill={look.ink}>{look.lines[1]}</text>
                  <Icon x={C - 11} y={C - 68} width={22} height={22} color={look.ink} strokeWidth={2.6} aria-hidden="true" />
                </g>
              );
            })}
            {REWARDS.map((_, i) => {
              const [x, y] = at(i * SEG, R - 1);
              return <circle key={i} cx={x} cy={y} r="4" fill="hsl(45 100% 80%)" stroke="hsl(var(--path-gold-dark))" strokeWidth="1.5" />;
            })}
          </g>
          <circle cx={C} cy={C} r={R} fill="url(#spin-sheen)" pointerEvents="none" />

          {/* Hub */}
          <circle cx={C} cy={C + 3} r="27" fill="hsl(var(--path-gold-dark))" />
          <circle cx={C} cy={C} r="27" fill="url(#spin-rim)" />
          <circle cx={C} cy={C} r="20" fill="url(#spin-hub)" />
          <Star x={C - 11} y={C - 11} width={22} height={22} color="#fff" fill="#fff" aria-hidden="true" />

          {/* Pointer */}
          <g ref={pointerRef} className="spin-pointer" data-flick="false">
            <path d="M150 46 L133 12 Q150 -2 167 12 Z" fill="hsl(var(--kit-discover-lip))" transform="translate(0 3)" />
            <path d="M150 46 L133 12 Q150 -2 167 12 Z" fill="hsl(322 85% 58%)" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
            <circle cx="150" cy="15" r="4.5" fill="#fff" />
          </g>
        </svg>

        {won && (
          <div className="spin-burst" aria-hidden="true">
            {burst.map((b, i) => (
              <i key={i} style={{ "--a": `${b.angle}deg`, "--d": `${b.distance}px`, background: `hsl(${b.color})`, animationDelay: `${b.delay}ms` } as CSSProperties} />
            ))}
          </div>
        )}
      </div>

      <div className="w-full min-h-[92px]" role="status" aria-live="polite">
        {won && winLook ? (
          <div className="kit-row kit-row-next kit-pop !min-h-[88px]">
            <GuideArt name={WIN_COPY[result.rarity].guide} size={84} animate />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold kit-text">You won</span>
              <span className="block text-2xl font-black leading-tight tabular-nums">{wonLabel}</span>
              <span className="block text-sm text-muted-foreground">{WIN_COPY[result.rarity].line}</span>
            </span>
            <span className="kit-coin kit-coin-lg" data-tone={winLook.tone}><winLook.icon aria-hidden="true" /></span>
          </div>
        ) : (
          <>
            <Button onClick={spin} disabled={phase !== "ready"} className="kit-cta w-full">
              {phase === "ready" ? "Spin to Win!" : phase === "spinning" ? "Spinning…" : "Saving your prize…"}
            </Button>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              {missed ? "That prize didn't save. Spin again." : "One free spin every day."}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
