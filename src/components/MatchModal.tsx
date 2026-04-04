import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Shield } from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";

interface MatchedUser {
  name: string;
  profile_image?: string | null;
  image?: string;
}

type CelebrationType = 'standard' | 'high_compatibility' | 'thot_match' | 'milestone';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchedProfile?: MatchedUser | null;
  matchedUser?: MatchedUser | null;
  onSendMessage: () => void;
  isFirstMatch?: boolean;
  isSuper?: boolean;
  compatibilityScore?: number;
  matchCount?: number;
}

const confettiSets: Record<CelebrationType, string[]> = {
  standard: ["💜", "💕", "✨", "💫", "🌟", "💖"],
  high_compatibility: ["💛", "💜", "⭐", "✨", "🏆", "💫"],
  thot_match: ["💜", "✨", "💖", "🔥", "💕", "⚡"],
  milestone: ["🎉", "🎊", "💜", "✨", "🥳", "🌟"],
};

export const MatchModal = ({
  isOpen, onClose, matchedProfile, matchedUser, onSendMessage,
  isFirstMatch = false, isSuper = false, compatibilityScore = 0, matchCount = 1,
}: MatchModalProps) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const user = matchedUser || matchedProfile;
  const ctaRef = useRef<HTMLButtonElement>(null);
  const [confetti, setConfetti] = useState<{ id: number; emoji: string; x: number; delay: number; duration: number }[]>([]);

  const celebrationType: CelebrationType = useMemo(() => {
    if (matchCount > 0 && matchCount % 10 === 0) return 'milestone';
    if (isSuper) return 'thot_match';
    if (compatibilityScore >= 85) return 'high_compatibility';
    return 'standard';
  }, [matchCount, isSuper, compatibilityScore]);

  const emojis = confettiSets[celebrationType];

  useEffect(() => {
    if (isOpen) {
      if (!prefersReducedMotion) {
        const particles = Array.from({ length: 12 }, (_, i) => ({
          id: i,
          emoji: emojis[Math.floor(Math.random() * emojis.length)],
          x: 5 + Math.random() * 90,
          delay: Math.random() * 1,
          duration: 2 + Math.random() * 1.5,
        }));
        setConfetti(particles);
        try { navigator.vibrate?.([50, 50, 100]); } catch {}
        haptic([50, 30, 50]);
      } else {
        setConfetti([]);
      }
      // Auto-focus CTA
      setTimeout(() => ctaRef.current?.focus(), 400);
    } else {
      setConfetti([]);
    }
  }, [isOpen, prefersReducedMotion, emojis]);

  if (!user) return null;

  const imageUrl = user.profile_image || (user as any).image || "/placeholder.svg";
  const firstName = user.name?.split(' ')[0] || user.name;

  const headlineText = celebrationType === 'thot_match'
    ? "They sent you a Thot!"
    : "You Both Said Yes";

  const subText = celebrationType === 'milestone'
    ? `Your ${matchCount}th match! 🎉`
    : `You and ${firstName} connected 💜`;

  const gradientClass = celebrationType === 'thot_match'
    ? "from-primary via-pink-500 to-secondary"
    : celebrationType === 'high_compatibility'
    ? "from-amber-500 via-primary to-secondary"
    : celebrationType === 'milestone'
    ? "from-primary via-secondary to-pink-500"
    : "from-primary to-secondary";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn("sm:max-w-md border-0 p-0 overflow-hidden bg-gradient-to-br", gradientClass)}
        aria-live="assertive"
        aria-label={`Match celebration: You and ${user.name} connected`}
      >
        {/* Confetti or reduced-motion fallback */}
        {!prefersReducedMotion ? (
          <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden="true">
            {confetti.map((p) => (
              <span
                key={p.id}
                className="absolute text-xl animate-confetti-heart"
                style={{
                  left: `${p.x}%`,
                  top: "-20px",
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                }}
              >
                {p.emoji}
              </span>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20" aria-hidden="true">
            <span className="text-6xl">💜</span>
          </div>
        )}

        <div className="relative p-8 text-center">
          {/* Animated heart background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10" aria-hidden="true">
            <Heart className={cn("h-64 w-64", !prefersReducedMotion && "animate-pulse")} />
          </div>

          <div className="relative z-10">
            <div className="mb-6">
              {celebrationType === 'milestone' ? (
                <div className="text-6xl font-bold text-white mb-4 animate-bounce-in">{matchCount}</div>
              ) : (
                <Heart className={cn("h-20 w-20 mx-auto text-white fill-current mb-4", !prefersReducedMotion && "animate-bounce-in")} />
              )}
              <h2
                className={cn("text-4xl font-bold text-white mb-2", !prefersReducedMotion && "animate-fade-in")}
                style={!prefersReducedMotion ? { animationDelay: "0.15s", animationFillMode: "both" } : undefined}
              >
                {headlineText}
              </h2>
              <p
                className={cn("text-white/90 text-lg", !prefersReducedMotion && "animate-fade-in")}
                style={!prefersReducedMotion ? { animationDelay: "0.3s", animationFillMode: "both" } : undefined}
              >
                {subText}
              </p>

              {/* Compatibility badge for high_compatibility */}
              {celebrationType === 'high_compatibility' && compatibilityScore > 0 && (
                <Badge className="mt-3 bg-white/20 text-white border-white/30 text-sm px-3 py-1">
                  ⭐ {compatibilityScore}% Compatible
                </Badge>
              )}

              {/* Thot match extra flair */}
              {celebrationType === 'thot_match' && (
                <p
                  className={cn("text-white/80 text-sm mt-2", !prefersReducedMotion && "animate-fade-in")}
                  style={!prefersReducedMotion ? { animationDelay: "0.45s", animationFillMode: "both" } : undefined}
                >
                  You Both Said Yes 💜
                </p>
              )}
            </div>

            <div className="flex justify-center mb-6">
              <div className={cn(!prefersReducedMotion && "animate-match-slide-right")}>
                <img
                  src={imageUrl}
                  alt={user.name}
                  className={cn("h-32 w-32 rounded-full object-cover border-4 border-white shadow-xl", !prefersReducedMotion && "animate-glow-ring")}
                />
              </div>
            </div>

            <div
              className={cn("flex flex-col gap-3", !prefersReducedMotion && "animate-stagger-fade")}
              style={!prefersReducedMotion ? { animationDelay: "0.4s", animationFillMode: "both" } : undefined}
            >
              <Button
                ref={ctaRef}
                size="lg"
                className="w-full h-12 bg-white text-primary hover:bg-white/90 font-semibold rounded-xl"
                onClick={() => {
                  onClose();
                  onSendMessage();
                }}
              >
                Say hi to {firstName} 👋
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="w-full h-10 text-white hover:bg-white/20 text-sm"
                onClick={onClose}
              >
                Keep discovering
              </Button>

              {/* First-match safety prompt */}
              {isFirstMatch && (
                <div className="mt-3 bg-white/10 rounded-lg p-3 text-left">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-white mt-0.5 shrink-0" />
                    <div>
                      <p className="text-white/90 text-sm">
                        Meeting someone new? Check out our safety tips before your first date.
                      </p>
                      <button
                        className="text-white underline text-sm mt-1 hover:text-white/80"
                        onClick={() => { onClose(); navigate("/privacy-policy"); }}
                      >
                        View Safety Tips →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};