import { useState, useCallback, memo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, X, Star, Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { VerifiedBadgeOverlay } from "@/components/VerifiedBadgeOverlay";
import { EducationTierBadge } from "@/components/EducationTierBadge";

interface MysteryProfile {
  id: string;
  name: string;
  age: number;
  profile_image: string | null;
  photos: string[] | null;
  compatibility_score?: number;
  badge_count?: number;
  is_verified?: boolean;
  bio: string | null;
  interests: string[] | null;
  location: string | null;
  [key: string]: any;
}

interface MysteryMatchCardProps {
  profile: MysteryProfile;
  canReveal: boolean;
  onReveal: () => Promise<boolean>;
  onConnect: (id: string) => void;
  onPass: (id: string) => void;
  onSuperLike: (id: string) => void;
  canSuperLike: boolean;
  superLikeBalance: number;
  onUpgrade: () => void;
}

export const MysteryMatchCard = memo(({
  profile,
  canReveal,
  onReveal,
  onConnect,
  onPass,
  onSuperLike,
  canSuperLike,
  superLikeBalance,
  onUpgrade,
}: MysteryMatchCardProps) => {
  const [revealed, setRevealed] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const { playBadgeUnlock } = useSoundEffects();

  const imageUrl = profile.profile_image || (profile.photos?.[0]) || "/placeholder.svg";
  const compatibility = profile.compatibility_score || 0;

  const handleTapReveal = useCallback(async () => {
    if (revealed || revealing) return;
    if (!canReveal) {
      onUpgrade();
      return;
    }
    setRevealing(true);
    const success = await onReveal();
    if (success) {
      playBadgeUnlock();
      // Animate blur away
      setTimeout(() => {
        setRevealed(true);
        setRevealing(false);
      }, 800);
    } else {
      setRevealing(false);
    }
  }, [revealed, revealing, canReveal, onReveal, playBadgeUnlock, onUpgrade]);

  // Pre-reveal: mystery card
  if (!revealed && !revealing) {
    return (
      <Card
        className="absolute inset-0 overflow-hidden cursor-pointer border-2 border-transparent"
        style={{
          borderImage: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary))) 1",
        }}
        onClick={handleTapReveal}
      >
        <div className="relative h-full w-full">
          {/* Blurred image */}
          <img
            src={imageUrl}
            alt="Mystery Match"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "blur(20px)", transform: "scale(1.1)" }}
            loading="lazy"
            decoding="async"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-primary/20" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <Sparkles className="h-12 w-12 text-primary mb-3 animate-pulse" />
            <h3 className="text-2xl font-bold text-foreground mb-1">Mystery Match 💜</h3>
            <div className="flex items-center gap-1.5 mb-4">
              <span className="text-lg font-semibold text-primary">{compatibility}%</span>
              <span className="text-sm text-muted-foreground">compatible</span>
            </div>
            {canReveal ? (
              <Button variant="outline" className="gap-2 border-primary/50 text-primary hover:bg-primary/10">
                <Sparkles className="h-4 w-4" /> Tap to Reveal
              </Button>
            ) : (
              <Button variant="outline" className="gap-2 border-primary/50 text-primary hover:bg-primary/10">
                <Lock className="h-4 w-4" /> Upgrade to Reveal
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Revealing animation
  if (revealing && !revealed) {
    return (
      <Card className="absolute inset-0 overflow-hidden border-2 border-primary/30">
        <div className="relative h-full w-full">
          <img
            src={imageUrl}
            alt="Revealing..."
            className="absolute inset-0 w-full h-full object-cover transition-[filter] duration-[800ms] ease-out"
            style={{ filter: "blur(0px)", transform: "scale(1.0)" }}
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 animate-fade-in" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
            <h3 className="text-xl font-bold text-foreground">{profile.name}, {profile.age}</h3>
            {profile.location && <p className="text-sm text-muted-foreground">{profile.location}</p>}
          </div>
        </div>
      </Card>
    );
  }

  // Revealed: acts like a normal card
  return (
    <Card className="absolute inset-0 overflow-hidden border-2 border-primary/20">
      <div className="relative h-full w-full">
        <img
          src={imageUrl}
          alt={profile.name}
          className="absolute inset-0 w-full h-full object-cover"
          width={400}
          height={500}
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          {profile.is_verified && <VerifiedBadgeOverlay isVerified={true} size="md" />}
          {(profile.badge_count || 0) > 0 && <EducationTierBadge badgeCount={profile.badge_count || 0} size="sm" />}
        </div>

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-bold text-foreground">{profile.name}, {profile.age}</h3>
          {profile.bio && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{profile.bio}</p>}
          {compatibility >= 50 && (
            <span className="inline-block mt-1.5 text-xs font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
              {compatibility}% Match
            </span>
          )}

          {/* Action buttons */}
          <div className="flex justify-center gap-3 mt-3">
            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-full border-destructive/30 hover:bg-destructive/10"
              onClick={() => onPass(profile.id)}
            >
              <X className="h-5 w-5 text-destructive" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-full border-primary/30 hover:bg-primary/10"
              onClick={() => onSuperLike(profile.id)}
              disabled={!canSuperLike && superLikeBalance <= 0}
            >
              <Star className="h-5 w-5 text-primary" />
            </Button>
            <Button
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={() => onConnect(profile.id)}
            >
              <Heart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}, (prev, next) => prev.profile.id === next.profile.id && prev.canReveal === next.canReveal);

MysteryMatchCard.displayName = "MysteryMatchCard";
