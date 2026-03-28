import { useState, useRef, useEffect, memo } from "react";
import { BlurImage } from "@/components/BlurImage";
import { Heart, X, Star, Zap, Shield, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VerifiedBadgeOverlay } from "@/components/VerifiedBadgeOverlay";
import { EducationTierBadge } from "@/components/EducationTierBadge";

interface EnhancedProfile {
  id: string;
  name: string;
  age: number;
  bio: string | null;
  location: string | null;
  profile_image: string | null;
  gender: string | null;
  pronouns: string | null;
  relationship_style: string | null;
  relationship_status: string | null;
  experience_level: string | null;
  interests: string[] | null;
  photos: string[] | null;
  display_name: string | null;
  is_verified: boolean;
  looking_for: string | null;
  zodiac_sign: string | null;
  languages: string[] | null;
  height_cm: number | null;
  badge_count?: number;
  compatibility_score?: number;
  compatibility_reasons?: string[];
  last_active?: string;
  verified?: boolean;
  distance?: number | null;
  is_boosted?: boolean;
}

interface SwipeDiscoveryCardProps {
  profile: EnhancedProfile;
  isTop: boolean;
  stackIndex: number;
  onConnect: (id: string) => void;
  onPass: (id: string) => void;
  onSuperLike?: (id: string) => void;
  canSuperLike?: boolean;
  superLikeBalance?: number;
  onViewProfile: () => void;
}

export const SwipeDiscoveryCard = memo(({
  profile,
  isTop,
  stackIndex,
  onConnect,
  onPass,
  onSuperLike,
  canSuperLike,
  superLikeBalance = 0,
  onViewProfile,
}: SwipeDiscoveryCardProps) => {
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [animate, setAnimate] = useState<"left" | "right" | "up" | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const photos = [profile.profile_image, ...(profile.photos || [])].filter(Boolean) as string[];

  useEffect(() => {
    setPhotoIndex(0);
  }, [profile.id]);

  // Passive touch listeners for smoother scrolling
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !isTop) return;
    const onTouchStart = (e: TouchEvent) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchEnd = () => handleDragEnd();
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [isTop]);

  // Drag handlers
  const handleDragStart = (clientX: number, clientY: number) => {
    if (!isTop) return;
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || !isTop) return;
    setDragOffset({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  };

  const handleDragEnd = () => {
    if (!isDragging || !isTop) return;
    setIsDragging(false);
    const threshold = 100;
    if (Math.abs(dragOffset.x) > threshold) {
      const direction = dragOffset.x > 0 ? "right" : "left";
      setAnimate(direction);
      setTimeout(() => {
        if (direction === "right") onConnect(profile.id);
        else onPass(profile.id);
      }, 400);
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const handleButtonSwipe = (direction: "left" | "right") => {
    if (!isTop) return;
    setAnimate(direction);
    setTimeout(() => {
      if (direction === "right") onConnect(profile.id);
      else onPass(profile.id);
    }, 400);
  };

  const rotation = isDragging ? dragOffset.x / 20 : 0;

  // Stack transforms
  const stackTransforms: Record<number, string> = {
    0: "",
    1: "scale(0.94) translateY(12px)",
    2: "scale(0.88) translateY(24px)",
  };
  const stackZ: Record<number, number> = { 0: 30, 1: 20, 2: 10 };

  const displayName = profile.display_name || profile.name;

  return (
    <div
      ref={cardRef}
      className={cn(
        "absolute w-full max-w-sm select-none",
        animate === "left" && "animate-swipe-left",
        animate === "right" && "animate-swipe-right",
      )}
      style={{
        transform: isDragging
          ? `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`
          : stackTransforms[stackIndex] || "",
        transition: isDragging ? "none" : "transform 0.3s ease",
        cursor: isTop ? "grab" : "default",
        zIndex: stackZ[stackIndex] || 1,
        pointerEvents: isTop ? "auto" : "none",
      }}
      onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      /* touch handlers added via passive useEffect above */
    >
      <div className="rounded-3xl overflow-hidden shadow-xl border border-border bg-card">
        {/* Photo area */}
        <div className="relative h-96 w-full overflow-hidden">
          <BlurImage
            src={photos[photoIndex] || "/placeholder.svg"}
            alt={displayName}
            className="h-full w-full"
            loading={isTop ? "eager" : "lazy"}
            fetchPriority={isTop ? "high" : undefined}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Dot indicators */}
          {photos.length > 1 && (
            <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 z-10">
              {photos.slice(0, 6).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all",
                    i === photoIndex ? "w-4 bg-white" : "w-2 bg-white/40"
                  )}
                />
              ))}
            </div>
          )}

          {/* Tap zones for photo cycling */}
          <button
            className="absolute top-0 left-0 w-1/3 h-full z-10"
            onClick={(e) => { e.stopPropagation(); setPhotoIndex(i => Math.max(0, i - 1)); }}
            aria-label="Previous photo"
          />
          <button
            className="absolute top-0 right-0 w-2/3 h-full z-10"
            onClick={(e) => { e.stopPropagation(); setPhotoIndex(i => Math.min(photos.length - 1, i + 1)); }}
            aria-label="Next photo"
          />

          {/* LIKE / NOPE overlays */}
          {isDragging && (
            <>
              <div
                className="absolute top-8 left-6 text-4xl font-bold text-success border-4 border-success rounded-2xl px-4 py-2 rotate-[-20deg] z-20"
                style={{ opacity: Math.max(0, Math.min(dragOffset.x / 100, 1)) }}
              >
                LIKE
              </div>
              <div
                className="absolute top-8 right-6 text-4xl font-bold text-destructive border-4 border-destructive rounded-2xl px-4 py-2 rotate-[20deg] z-20"
                style={{ opacity: Math.max(0, Math.min(-dragOffset.x / 100, 1)) }}
              >
                NOPE
              </div>
            </>
          )}

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex gap-1.5 z-10">
            {profile.is_boosted && (
              <Badge className="bg-amber-500/90 text-white text-[10px] border-0">
                <Zap className="h-3 w-3 mr-0.5" /> Boosted
              </Badge>
            )}
            {profile.verified && (
              <Badge className="bg-success/90 text-white text-[10px] border-0">
                <Shield className="h-3 w-3 mr-0.5" /> Verified
              </Badge>
            )}
          </div>

          {/* Compatibility badge */}
          {profile.compatibility_score != null && profile.compatibility_score > 0 && (
            <div className="absolute top-3 right-3 z-10">
              <Badge variant="secondary" className="bg-primary/90 text-primary-foreground text-xs font-bold">
                {profile.compatibility_score}% Match
              </Badge>
            </div>
          )}

          {/* Verified badge overlay on photo */}
          <div className="absolute bottom-16 right-4 z-20">
            <VerifiedBadgeOverlay isVerified={!!profile.verified} size="lg" />
          </div>

          {/* Info over photo */}
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white z-10">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">
                {displayName}, {profile.age}
              </h2>
              {profile.badge_count != null && profile.badge_count >= 5 && (
                <EducationTierBadge badgeCount={profile.badge_count} size="sm" />
              )}
            </div>
            {profile.pronouns && (
              <p className="text-sm opacity-80">{profile.pronouns}</p>
            )}
            {profile.relationship_style && (
              <Badge variant="outline" className="mt-1 border-white/30 text-white/90 text-[10px]">
                {profile.relationship_style.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </Badge>
            )}
          </div>
        </div>

        {/* Card body — tappable for detail */}
        <button
          className="w-full text-left p-4 space-y-2"
          onClick={(e) => { e.stopPropagation(); onViewProfile(); }}
        >
          {profile.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>
          )}
          {profile.compatibility_reasons && profile.compatibility_reasons.length > 0 && (
            <div className="space-y-0.5">
              {profile.compatibility_reasons.slice(0, 2).map((reason, i) => (
                <p key={i} className="text-xs text-primary flex items-center gap-1">
                  <Heart className="h-3 w-3 shrink-0" /> {reason}
                </p>
              ))}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 justify-center pt-1">
            <ChevronDown className="h-3 w-3" /> Tap for full profile
          </p>
        </button>
      </div>

      {/* Action buttons */}
      {isTop && (
        <div className="absolute bottom-[-70px] left-1/2 -translate-x-1/2 flex items-center gap-4">
          <Button
            variant="outline"
            className="h-[46px] w-[46px] rounded-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={(e) => { e.stopPropagation(); handleButtonSwipe("left"); }}
          >
            <X className="h-5 w-5" />
          </Button>

          {canSuperLike && (
            <Button
              variant="outline"
              className="h-[38px] w-[38px] rounded-full border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                onSuperLike?.(profile.id);
              }}
            >
              <Star className="h-4 w-4" />
            </Button>
          )}

          <Button
            className="h-[54px] w-[54px] rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground hover:scale-110 transition-transform shadow-lg"
            onClick={(e) => { e.stopPropagation(); handleButtonSwipe("right"); }}
          >
            <Heart className="h-6 w-6 fill-current" />
          </Button>
        </div>
      )}
    </div>
  );
});

SwipeDiscoveryCard.displayName = "SwipeDiscoveryCard";
