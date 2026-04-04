import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

export type MascotEmotion =
  | "encouraging"
  | "cheering"
  | "empathetic"
  | "celebrating"
  | "proud"
  | "worried"
  | "excited"
  | "thinking"
  | "waving"
  | "sleeping"
  | "surprised"
  | "love";

interface MascotReactionProps {
  emotion: MascotEmotion;
  size?: "small" | "medium" | "large";
  position?: "inline" | "bottom-right" | "center" | "toast";
  message?: string;
  animate?: boolean;
  onComplete?: () => void;
}

const EMOTION_EMOJI: Record<MascotEmotion, string> = {
  encouraging: "💪",
  cheering: "🎉",
  empathetic: "🤗",
  celebrating: "🥳",
  proud: "😊",
  worried: "😟",
  excited: "🤩",
  thinking: "🤔",
  waving: "👋",
  sleeping: "😴",
  surprised: "😮",
  love: "😍",
};

const EMOTION_ANIMATION: Record<MascotEmotion, string> = {
  encouraging: "animate-float-gentle",
  cheering: "animate-bounce-in",
  empathetic: "animate-mascot-empathetic",
  celebrating: "animate-mascot-celebrate",
  proud: "animate-float-gentle",
  worried: "animate-mascot-shake",
  excited: "animate-mascot-bounce",
  thinking: "animate-pulse",
  waving: "animate-mascot-wave",
  sleeping: "animate-mascot-sleep",
  surprised: "animate-mascot-surprise",
  love: "animate-mascot-love",
};

const SIZE_MAP = {
  small: "text-4xl",
  medium: "text-6xl",
  large: "text-8xl",
};

const POSITION_MAP = {
  inline: "",
  "bottom-right": "fixed bottom-24 right-4 z-[55]",
  center: "fixed inset-0 flex items-center justify-center z-[55] pointer-events-none",
  toast: "fixed bottom-24 right-4 z-[55]",
};

export const MascotReaction = ({
  emotion,
  size = "medium",
  position = "inline",
  message,
  animate = true,
  onComplete,
}: MascotReactionProps) => {
  const reducedMotion = useReducedMotion();
  const shouldAnimate = animate && !reducedMotion;

  const emoji = EMOTION_EMOJI[emotion];
  const animClass = shouldAnimate ? EMOTION_ANIMATION[emotion] : "";

  return (
    <div className={cn(POSITION_MAP[position])}>
      <div className="flex flex-col items-center gap-2">
        {/* Speech bubble */}
        {message && (
          <div
            className={cn(
              "bg-card text-card-foreground border border-border rounded-2xl px-4 py-2 max-w-[220px] text-center shadow-lg relative",
              shouldAnimate && "animate-fade-in"
            )}
            style={shouldAnimate ? { animationDelay: "0.2s", animationFillMode: "both" } : undefined}
          >
            <p className="text-sm font-medium">{message}</p>
            {/* Tail */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-r border-b border-border rotate-45" />
          </div>
        )}

        {/* Mascot emoji */}
        <span
          className={cn(SIZE_MAP[size], animClass)}
          role="img"
          aria-label={`Mascot feeling ${emotion}`}
        >
          {emoji}
        </span>

        {/* Love hearts */}
        {emotion === "love" && shouldAnimate && (
          <div className="absolute pointer-events-none" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="absolute text-xl animate-emoji-burst"
                style={{
                  left: `${-20 + i * 20}px`,
                  top: "-10px",
                  animationDelay: `${i * 0.2}s`,
                }}
              >
                💜
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
