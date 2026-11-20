import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getLevelName } from "@/hooks/useLearningStats";
import { Flame, Star, Share2 } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { ShareableAchievementCard } from "@/components/ShareableAchievementCard";
import type { AchievementData } from "@/lib/shareableCard";
import { haptic } from "@/lib/haptics";
import { Mascot } from "@/components/mascot/Mascot";
import { EducationBadge } from "@/components/EducationBadge";

interface CelebrationModalProps {
  type: "level_up" | "streak_milestone" | "badge_earned" | null;
  level?: number;
  streak?: number;
  badgeTitle?: string;
  badgeSlug?: string;
  badgeTier?: string | null;
  isFoundationComplete?: boolean;
  tierName?: string;
  onClose: () => void;
}

const streakMessages: Record<number, string> = {
  3: "You're building a habit! 🔥",
  7: "One whole week! You earned a streak freeze! 🧊",
  14: "Two weeks strong! Unstoppable! 💪",
  30: "30 days! You're a learning machine! 🏆",
  100: "100 DAYS! Absolute legend! 👑",
};

const streakRewards: Record<number, string> = {
  7: "You earned a bonus Thot! 💜",
  30: "You earned a free 24-hour Profile Boost! ⚡",
  100: "You earned 3 Thots for this incredible milestone! 🏆",
};

const BRAND_COLORS = [
  "hsl(270 60% 50%)",
  "hsl(320 70% 55%)",
  "hsl(280 80% 65%)",
  "hsl(45 85% 55%)",
  "hsl(270 55% 58%)",
  "hsl(340 65% 55%)",
  "hsl(280 60% 45%)",
  "hsl(50 90% 60%)",
];


// Per-badge body copy keyed by slug fragments. Falls back to a generic
// advanced-badge message if no specific match is found.
const badgeBodyByKeyword: Array<{ match: RegExp; body: string }> = [
  { match: /consent/i, body: "You now understand the building blocks of enthusiastic consent. That's a big deal." },
  { match: /communication/i, body: "Better conversations start here. You've got the tools." },
  { match: /(sexual[-_ ]?health|sti|safer[-_ ]?sex)/i, body: "Knowledge is power — and safety." },
  { match: /desire/i, body: "Understanding desire is the first step to expressing it." },
  { match: /(emotional[-_ ]?intelligence|eq)/i, body: "You've just leveled up the most important relationship skill there is." },
];

const getBadgeBody = (slug?: string, title?: string): string => {
  const haystack = `${slug || ""} ${title || ""}`;
  for (const entry of badgeBodyByKeyword) {
    if (entry.match.test(haystack)) return entry.body;
  }
  return "Another badge earned. You're becoming a relationship expert.";
};

export const CelebrationModal = ({ type, level, streak, badgeTitle, badgeSlug, badgeTier, isFoundationComplete, tierName, onClose }: CelebrationModalProps) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number; color: string; size: number; shape: string }>>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const soundPlayed = useRef(false);
  const { playBadgeUnlock, playStreakMilestone } = useSoundEffects();

  const getShareData = (): AchievementData | null => {
    if (!type) return null;
    switch (type) {
      case "level_up": return null; // Level ups don't generate share cards
      case "streak_milestone": return { type: "streak_milestone", streakDays: streak };
      case "badge_earned": return { type: "badge_earned", badgeName: badgeTitle };
    }
  };

  useEffect(() => {
    if (type) {
      // Haptic feedback for celebrations
      if (type === "badge_earned") haptic(30);
      else if (type === "streak_milestone") haptic(30);
      else if (type === "level_up") haptic([30, 20, 30]);

      if (!prefersReducedMotion) {
        const shapes = ["circle", "rect", "star"];
        const count = 50;
        setConfetti(
          Array.from({ length: count }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            delay: Math.random() * 1.2,
            color: BRAND_COLORS[i % BRAND_COLORS.length],
            size: 4 + Math.random() * 8,
            shape: shapes[i % shapes.length],
          }))
        );
      } else {
        setConfetti([]);
      }
      soundPlayed.current = false;
    }
  }, [type, prefersReducedMotion]);

  useEffect(() => {
    if (!type || soundPlayed.current) return;
    soundPlayed.current = true;
    if (type === "streak_milestone") playStreakMilestone();
    else if (type === "badge_earned" || type === "level_up") playBadgeUnlock();
  }, [type, playStreakMilestone, playBadgeUnlock]);

  if (!type) return null;

  const renderConfettiPiece = (c: typeof confetti[0]) => {
    const baseStyle: React.CSSProperties = {
      left: `${c.x}%`,
      animationDelay: `${c.delay}s`,
      backgroundColor: c.color,
    };

    if (c.shape === "rect") {
      return (
        <div
          key={c.id}
          className="absolute animate-confetti-fall"
          style={{ ...baseStyle, width: c.size * 0.6, height: c.size * 1.4, borderRadius: 2 }}
        />
      );
    }
    if (c.shape === "star") {
      return (
        <div
          key={c.id}
          className="absolute animate-confetti-fall"
          style={{ ...baseStyle, width: c.size, height: c.size, borderRadius: "1px", transform: "rotate(45deg)" }}
        />
      );
    }
    return (
      <div
        key={c.id}
        className="absolute rounded-full animate-confetti-fall"
        style={{ ...baseStyle, width: c.size, height: c.size }}
      />
    );
  };

  return (
    <Dialog open={!!type} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-sm text-center overflow-hidden">
        {/* Confetti */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          {confetti.map(renderConfettiPiece)}
        </div>

        <div className="relative z-10 py-4">
          {type === "level_up" && (
            <>
              <div className="relative mx-auto w-20 h-20 mb-4">
                <Star className="h-16 w-16 mx-auto text-accent animate-bounce" />
                <div className="absolute inset-0 rounded-full animate-ripple-complete bg-accent/30" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Level Up! 🎉</h2>
              <p className="text-lg text-muted-foreground">
                You're now a <span className="font-bold text-foreground">{getLevelName(level || 1)}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">Level {level}</p>
            </>
          )}
          {type === "streak_milestone" && (
            <>
              <div className="relative mx-auto w-20 h-20 mb-4">
                <Flame className="h-16 w-16 mx-auto text-primary animate-bounce" />
                <div className="absolute inset-0 rounded-full animate-streak-glow" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{streak}-Day Streak! 🔥</h2>
              <p className="text-muted-foreground">
                {streakMessages[streak || 0] || `${streak} days of learning! Amazing!`}
              </p>
              {streakRewards[streak || 0] && (
                <p className="text-sm font-semibold text-primary mt-2 animate-bounce-in">
                  {streakRewards[streak || 0]}
                </p>
              )}
            </>
          )}
          {type === "badge_earned" && !isFoundationComplete && (
            <>
              <div className="mb-4"><Mascot mood="graduate" size="lg" /></div>
              <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                <EducationBadge moduleSlug={badgeSlug || ""} title={badgeTitle || ""} tier={badgeTier || "foundation"} isEarned size="md" />
                Badge Earned: {badgeTitle} 💜
              </h2>
              <p className="text-muted-foreground">
                {getBadgeBody(badgeSlug, badgeTitle)}
              </p>
            </>
          )}
          {type === "badge_earned" && isFoundationComplete && (
            <>
              <div className="mb-4"><Mascot mood="graduate" size="lg" /></div>
              <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2"><EducationBadge moduleSlug={badgeSlug || ""} title={badgeTitle || ""} tier={badgeTier || "foundation"} isEarned size="md" />Foundation Complete! 🎉</h2>
              <p className="text-muted-foreground">
                Discovery is now unlocked. Start connecting with people who've done the work too.
              </p>
            </>
          )}
          {getShareData() && (
            <Button
              variant="outline"
              onClick={() => setShareOpen(true)}
              className="mt-4 w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Share2 className="h-4 w-4" /> Share Badge Card
            </Button>
          )}
          {type === "badge_earned" && isFoundationComplete ? (
            <Button
              onClick={() => { onClose(); navigate("/"); }}
              className="mt-2 w-full"
            >
              Go to Discovery
            </Button>
          ) : type === "badge_earned" ? (
            <Button onClick={onClose} className="mt-2 w-full">
              Continue Learning
            </Button>
          ) : (
            <Button onClick={onClose} className="mt-2 w-full">
              Continue
            </Button>
          )}
        </div>
      </DialogContent>

      {getShareData() && (
        <ShareableAchievementCard
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          data={getShareData() ?? { type: "badge_earned", badgeName: badgeTitle }}
        />
      )}
    </Dialog>
  );
};
