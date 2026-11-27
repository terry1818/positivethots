import { GuideArt } from "@/components/mascot/GuideArt";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight, MessageCircle, Shield } from "lucide-react";
import { useEffect, useState, useMemo, useRef, type CSSProperties } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useNavigate } from "react-router-dom";
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
    ? `That's connection number ${matchCount}. You and ${firstName} both said yes.`
    : `You and ${firstName} want to connect. Say hi!`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="kit-area-discover max-h-[92dvh] overflow-y-auto border-0 bg-card p-0 sm:max-w-md"
        aria-describedby="match-modal-description"
      >
        {/* Confetti. Skipped entirely under reduced motion. */}
        {!prefersReducedMotion && (
          <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden="true">
            {confetti.map((p) => (
              <span
                key={p.id}
                className="absolute text-xl animate-confetti-heart"
                style={{ left: `${p.x}%`, top: "-20px", animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }}
              >
                {p.emoji}
              </span>
            ))}
          </div>
        )}

        {/* The moment: the guide celebrating beside the person who said yes. */}
        <div className="kit-panel !rounded-b-none !rounded-t-lg !border-0 h-[200px]">
          <div className="flex items-end justify-center gap-3 pb-3">
            <GuideArt name="guide-high-five" size={132} />
            <img
              src={imageUrl}
              alt={user.name}
              className={cn("mb-3 h-28 w-28 rounded-full border-4 border-white object-cover shadow-xl", !prefersReducedMotion && "kit-pop")}
            />
          </div>
        </div>

        <div className="px-6 pb-6 pt-5 text-center">
          <DialogTitle className={cn("text-3xl font-extrabold leading-tight [text-wrap:balance]", !prefersReducedMotion && "kit-rise")}>
            {headlineText}
          </DialogTitle>
          <DialogDescription
            id="match-modal-description"
            className={cn("mt-2 text-base text-muted-foreground [text-wrap:pretty]", !prefersReducedMotion && "kit-rise")}
            style={{ "--i": 1 } as CSSProperties}
          >
            {subText}
          </DialogDescription>

          {(celebrationType === 'high_compatibility' && compatibilityScore > 0) || celebrationType === 'thot_match' ? (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {celebrationType === 'high_compatibility' && <span className="kit-chip" data-tone="area">{compatibilityScore}% Compatible</span>}
              {celebrationType === 'thot_match' && <span className="kit-chip">You Both Said Yes</span>}
            </div>
          ) : null}

          <div className={cn("mt-6 flex flex-col gap-2", !prefersReducedMotion && "kit-rise")} style={{ "--i": 2 } as CSSProperties}>
            <Button
              ref={ctaRef}
              className="kit-cta w-full gap-2"
              onClick={() => {
                onClose();
                onSendMessage();
              }}
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" /> Say hi to {firstName}
            </Button>
            <Button variant="ghost" className="min-h-[44px] w-full font-bold text-muted-foreground" onClick={onClose}>
              Keep browsing
            </Button>
          </div>

          {/* First connection: where the safety guidance lives. */}
          {isFirstMatch && (
            <button
              type="button"
              className="kit-row mt-4"
              onClick={() => { onClose(); navigate("/resources?tab=advocacy"); }}
            >
              <span className="kit-coin" data-tone="urgent"><Shield aria-hidden="true" /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold leading-tight">Meeting someone new?</span>
                <span className="block text-sm text-muted-foreground">Read the safety tips before you meet in person.</span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>
          )}

          <p className="mt-5 text-xs text-muted-foreground" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
            Think Positive Thots.<sup style={{ fontSize: "60%", verticalAlign: "super" }}>®</sup>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
