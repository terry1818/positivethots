import { useEffect, useState, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getLevelName } from "@/hooks/useLearningStats";
import { Flame, Zap, Star, Share2, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import mascotImg from "@/assets/mascot-celebration.png";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { ShareableAchievementCard } from "@/components/ShareableAchievementCard";
import type { AchievementData } from "@/lib/shareableCard";

interface CelebrationModalProps {
  type: "level_up" | "streak_milestone" | "badge_earned" | "tier_complete" | null;
  level?: number;
  streak?: number;
  badgeTitle?: string;
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

const tierTopics: Record<string, string> = {
  Foundation: "consent, communication, boundaries, trust, and relationship basics",
  "Sexual Health": "STI prevention, safer sex practices, sexual wellness, and testing awareness",
  "Identity & Diversity": "gender identity, sexual orientation, pronouns, and inclusivity",
  "Healthy Relationships": "conflict resolution, attachment styles, emotional intelligence, and partner communication",
  "Advanced Topics": "ethical non-monogamy, kink education, community leadership, and mentorship",
};

const APP_URL = "https://positivethots.lovable.app";

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


export const CelebrationModal = ({ type, level, streak, badgeTitle, tierName, onClose }: CelebrationModalProps) => {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number; color: string; size: number; shape: string }>>([]);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const soundPlayed = useRef(false);
  const { playBadgeUnlock, playStreakMilestone } = useSoundEffects();

  const getShareData = (): AchievementData | null => {
    if (!type) return null;
    switch (type) {
      case "level_up": return null; // Level ups don't generate share cards
      case "streak_milestone": return { type: "streak_milestone", streakDays: streak };
      case "badge_earned": return { type: "badge_earned", badgeName: badgeTitle };
      case "tier_complete": return { type: "tier_complete", tierName };
    }
  };

  useEffect(() => {
    if (type) {
      const shapes = ["circle", "rect", "star"];
      const count = type === "tier_complete" ? 80 : 50;
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
      setCopied(false);
      soundPlayed.current = false;
    }
  }, [type]);

  useEffect(() => {
    if (!type || soundPlayed.current) return;
    soundPlayed.current = true;
    if (type === "streak_milestone") playStreakMilestone();
    else if (type === "badge_earned" || type === "level_up") playBadgeUnlock();
    else if (type === "tier_complete") playBadgeUnlock();
  }, [type, playStreakMilestone, playBadgeUnlock]);

  if (!type) return null;

  const getShareText = () => {
    const topics = tierTopics[tierName || ""] || "";
    return `I just completed the ${tierName} tier on Positive Thots! 🏆 I've passed courses covering ${topics}. Join me in learning at ${APP_URL}`;
  };

  const handleShareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}`, "_blank");
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(getShareText())}&u=${encodeURIComponent(APP_URL)}`, "_blank");
  };

  const handleShareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(APP_URL)}`, "_blank");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getShareText());
      setCopied(true);
      toast({ title: "Copied!", description: "Achievement text copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

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
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
          {type === "badge_earned" && (
            <>
              <Zap className="h-16 w-16 mx-auto text-success mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold mb-2">Badge Earned! 🏅</h2>
              <p className="text-muted-foreground">
                You completed <span className="font-bold text-foreground">{badgeTitle}</span>!
              </p>
            </>
          )}
          {type === "tier_complete" && (
            <>
              {/* Mascot celebration */}
              <div className="relative mx-auto w-28 h-28 mb-4 overflow-hidden rounded-full">
                {/* Glow ring behind mascot */}
                <div className="absolute inset-0 rounded-full animate-glow-ring bg-primary/10" />
                <img
                  src={mascotImg}
                  alt="Celebration!"
                  width={112}
                  height={140}
                  className="absolute inset-x-0 z-10 mx-auto w-28 object-contain animate-mascot-entrance"
                  style={{ animationFillMode: "both", bottom: "-48%", height: "162%" }}
                />
              </div>
              <div className="animate-float-gentle">
                <h2 className="text-2xl font-bold mb-2">Tier Complete! 🏆</h2>
                <p className="text-muted-foreground">
                  You've mastered <span className="font-bold text-foreground">{tierName}</span>!
                </p>
                {tierTopics[tierName || ""] && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Covering {tierTopics[tierName || ""]}
                  </p>
                )}
              </div>

              {/* Share section */}
              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-3 flex items-center justify-center gap-1">
                  <Share2 className="h-3 w-3" /> Share your achievement
                </p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleShareTwitter} className="text-xs gap-1.5">
                    𝕏 Post
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShareFacebook} className="text-xs gap-1.5">
                    Facebook
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShareLinkedIn} className="text-xs gap-1.5">
                    LinkedIn
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs gap-1.5">
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
            </>
          )}
          {getShareData() && (
            <Button
              variant="outline"
              onClick={() => setShareOpen(true)}
              className="mt-4 w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Share2 className="h-4 w-4" /> Share Achievement Card
            </Button>
          )}
          <Button onClick={onClose} className="mt-2 w-full">
            Continue
          </Button>
        </div>
      </DialogContent>

      {getShareData() && (
        <ShareableAchievementCard
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          data={getShareData()!}
        />
      )}
    </Dialog>
  );
};
