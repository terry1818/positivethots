import { useState, useRef, useEffect, memo, useCallback } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BlurImage } from "@/components/BlurImage";
import { Heart, X, Star, Zap, Shield, ChevronDown, RefreshCw, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VerifiedBadgeOverlay } from "@/components/VerifiedBadgeOverlay";
import { EducationTierBadge } from "@/components/EducationTierBadge";
import { FlairBadges } from "@/components/profile/FlairBadges";
import { ProfileFrame } from "@/components/profile/ProfileFrame";
import { useReducedMotion } from "@/hooks/useReducedMotion";

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
  photo_focal_points?: Record<string, number>;
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
  is_recycled?: boolean;
  onUpgradeSuperLike?: () => void;
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
  is_recycled,
  onUpgradeSuperLike,
}: SwipeDiscoveryCardProps) => {
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [animate, setAnimate] = useState<"left" | "right" | "up" | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(new Set());
  const cardRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const allPhotos = [profile.profile_image, ...(profile.photos || [])].filter(Boolean) as string[];
  const photos = allPhotos.filter(url => !failedPhotos.has(url));

  const handlePhotoError = useCallback((url: string) => {
    setFailedPhotos(prev => {
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  }, []);

  useEffect(() => {
    setPhotoIndex(0);
    setFailedPhotos(new Set());
  }, [profile.id]);

  // Clamp photoIndex when photos change due to failures
  useEffect(() => {
    if (photos.length > 0 && photoIndex >= photos.length) {
      setPhotoIndex(Math.max(0, photos.length - 1));
    }
  }, [photos.length, photoIndex]);

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
      // Haptic feedback at swipe threshold
      try { navigator?.vibrate?.([30]); } catch {}
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

  const handleSuperLikeTap = () => {
    if (!isTop) return;
    setAnimate("up");
    setTimeout(() => {
      onSuperLike?.(profile.id);
    }, 400);
  };

  const rotation = isDragging && !reducedMotion ? dragOffset.x / 20 : 0;
  const dragProgress = isDragging ? Math.min(Math.abs(dragOffset.x) / 100, 1) : 0;
  const isRight = dragOffset.x > 0;

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
        "absolute w-full max-w-sm md:max-w-md max-h-full select-none",
        animate === "left" && "animate-swipe-left",
        animate === "right" && "animate-swipe-right",
        animate === "up" && "animate-swipe-fly-up",
        !animate && stackIndex === 0 && "animate-card-enter",
      )}
      style={{
        transform: isDragging
          ? `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`
          : stackTransforms[stackIndex] || "",
        transition: isDragging ? "none" : "transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        cursor: isTop ? "grab" : "default",
        zIndex: stackZ[stackIndex] || 1,
        pointerEvents: isTop ? "auto" : "none",
      }}
      onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      <div className="rounded-3xl overflow-hidden shadow-xl border border-border bg-card">
        {/* Photo area */}
        <div className="relative h-[40vh] max-h-80 w-full overflow-hidden">
          {photos.length > 0 ? (
            <BlurImage
              src={photos[photoIndex] || "/placeholder.svg"}
              alt={displayName}
              className="h-full w-full"
              loading={isTop ? "eager" : "lazy"}
              fetchPriority={isTop ? "high" : undefined}
              objectPosition={`center ${profile.photo_focal_points?.[photos[photoIndex]] ?? 50}%`}
              onError={() => handlePhotoError(photos[photoIndex])}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-6xl font-bold text-primary-foreground">{displayName?.[0] || "?"}</span>
            </div>
          )}

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
                    i === photoIndex ? "w-4 bg-white" : "w-2 bg-white/70 ring-1 ring-white/50"
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
              {/* Purple tint overlay for right swipe (Connect) */}
              <div
                className="absolute inset-0 z-15 pointer-events-none transition-opacity"
                style={{
                  opacity: isRight ? dragProgress * 0.5 : 0,
                  background: "linear-gradient(135deg, hsl(270 60% 50% / 0.4), hsl(320 70% 55% / 0.3))",
                }}
              />
              {/* Grayscale overlay for left swipe (Pass) */}
              <div
                className="absolute inset-0 z-15 pointer-events-none transition-opacity"
                style={{
                  opacity: !isRight ? dragProgress * 0.6 : 0,
                  background: "hsl(0 0% 30% / 0.5)",
                  filter: "saturate(0.3)",
                }}
              />
              {/* Pink/magenta overlay for up swipe (Send a Thot) */}
              {dragOffset.y < -30 && (
                <div
                  className="absolute inset-0 z-15 pointer-events-none"
                  style={{
                    opacity: Math.min(Math.abs(dragOffset.y) / 150, 0.6),
                    background: "linear-gradient(180deg, hsl(320 70% 55% / 0.5), hsl(280 80% 65% / 0.3))",
                  }}
                />
              )}
              {/* Connect label (right) */}
              <div
                className="absolute top-8 left-6 z-20 flex flex-col items-center bg-black/30 backdrop-blur-sm rounded-xl p-4 rotate-[-20deg]"
                style={{ opacity: Math.max(0, Math.min(dragOffset.x / 100, 1)) }}
              >
                <Heart className="h-12 w-12 text-white drop-shadow-lg" fill="white" />
                <span className="text-white font-bold text-lg drop-shadow-lg">Connect 💜</span>
              </div>
              {/* Pass label (left) */}
              <div
                className="absolute top-8 right-6 z-20 flex flex-col items-center bg-black/30 backdrop-blur-sm rounded-xl p-4 rotate-[20deg]"
                style={{ opacity: Math.max(0, Math.min(-dragOffset.x / 100, 1)) }}
              >
                <X className="h-12 w-12 text-white drop-shadow-lg" />
                <span className="text-white font-bold text-lg drop-shadow-lg">Pass</span>
              </div>
              {/* Send a Thot label (up) */}
              {dragOffset.y < -30 && (
                <div
                  className="absolute top-1/3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center bg-black/30 backdrop-blur-sm rounded-xl p-4"
                  style={{ opacity: Math.min(Math.abs(dragOffset.y) / 100, 1) }}
                >
                  <Star className="h-12 w-12 text-white drop-shadow-lg" fill="white" />
                  <span className="text-white font-bold text-lg drop-shadow-lg">Send a Thot 💜</span>
                </div>
              )}
            </>
          )}

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex gap-1.5 z-10">
            {isTop && is_recycled && (
              <div
                className="flex items-center gap-1.5 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1"
                aria-label="Previously viewed profile"
              >
                <RefreshCw className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Second look</span>
              </div>
            )}
            {profile.is_boosted && (
              <Badge className="bg-amber-500/90 text-white text-sm border-0">
                <Zap className="h-3 w-3 mr-0.5" /> Boosted
              </Badge>
            )}
            {profile.verified && (
              <Badge className="bg-success/90 text-white text-sm border-0">
                <Shield className="h-3 w-3 mr-0.5" /> Verified
              </Badge>
            )}
          </div>

          {/* Compatibility badge */}
          {profile.compatibility_score != null && profile.compatibility_score > 0 && (
            <div className="absolute top-3 right-3 z-10" data-walkthrough="compatibility-score" data-tour="compatibility-score">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="bg-primary/90 text-primary-foreground text-sm font-bold cursor-help">
                    {profile.compatibility_score}% Match
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px] text-center">
                  Based on shared interests, relationship style, goals, education level, and location.
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Verified badge overlay on photo */}
          {!!profile.verified && (
            <div className="absolute bottom-16 right-4 z-20 drop-shadow-[0_1px_3px_rgba(255,255,255,0.4)]">
              <VerifiedBadgeOverlay isVerified size="md" />
            </div>
          )}

          {/* Info over photo */}
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white z-10">
            <div className="flex items-center gap-3">
              {/* Small framed avatar */}
              <ProfileFrame frameId={(profile as any).selected_frame} size="sm">
                {photos.length > 0 ? (
                  <BlurImage
                    src={photos[0]}
                    alt={`Profile photo of ${displayName}`}
                    className="h-full w-full rounded-full"
                    onError={() => handlePhotoError(photos[0])}
                  />
                ) : (
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {displayName?.[0] || "?"}
                  </div>
                )}
              </ProfileFrame>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold truncate">
                    {displayName}, {profile.age}
                  </h2>
                  {profile.badge_count != null && profile.badge_count >= 5 && (
                    <EducationTierBadge badgeCount={profile.badge_count} size="sm" />
                  )}
                </div>
                {profile.pronouns && (
                  <p className="text-sm opacity-80">{profile.pronouns}</p>
                )}
              </div>
            </div>
            {/* Flair badges */}
            <FlairBadges
              badgeCount={profile.badge_count}
              className="mt-1.5"
            />
            {profile.relationship_style && (
              <Badge variant="outline" className="mt-1 border-white/30 text-white/90 text-sm">
                {profile.relationship_style.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </Badge>
            )}
          </div>
        </div>

        {/* Card body — tappable for detail */}
        <button
          className="w-full text-left p-3 space-y-1.5"
          onClick={(e) => { e.stopPropagation(); onViewProfile(); }}
          aria-label={`View full profile of ${displayName}`}
        >
          {profile.bio && (
            <p className="text-sm text-muted-foreground line-clamp-1">{profile.bio}</p>
          )}
          {profile.compatibility_reasons && profile.compatibility_reasons.length > 0 && (
            <div className="space-y-0.5">
              {profile.compatibility_reasons.slice(0, 2).map((reason, i) => (
                <p key={i} className="text-sm text-primary flex items-center gap-1">
                  <Heart className="h-3 w-3 shrink-0" /> {reason}
                </p>
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground flex items-center gap-0.5 justify-center pt-1">
            <ChevronDown className="h-3 w-3" /> Tap for full profile
          </p>
        </button>
      </div>

      {/* Action buttons */}
      {isTop && (
        <div className="flex items-center justify-center gap-4 py-2" data-walkthrough="action-buttons" data-tour="action-buttons">
          <Button
            variant="outline"
            className="h-14 w-14 rounded-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={(e) => { e.stopPropagation(); handleButtonSwipe("left"); }}
            aria-label={`Pass on ${displayName}`}
          >
            <X className="h-6 w-6" />
          </Button>

          <Button
            variant="outline"
            className={cn(
              "h-12 w-12 rounded-full border-2 border-primary text-primary relative",
              canSuperLike
                ? "bg-gradient-to-br from-primary/10 to-secondary/10 hover:from-primary hover:to-secondary hover:text-primary-foreground active:scale-110"
                : "opacity-60 grayscale"
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (canSuperLike) {
                handleSuperLikeTap();
              } else {
                onUpgradeSuperLike?.();
              }
            }}
            aria-label={canSuperLike ? `Send a Thot to ${displayName}` : "Get Thots — upgrade to send"}
          >
            <Star className="h-5 w-5" />
            {!canSuperLike && (
              <Lock className="h-3 w-3 absolute -bottom-0.5 -right-0.5 text-muted-foreground" />
            )}
          </Button>

          <Button
            className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground hover:scale-110 transition-transform shadow-lg"
            onClick={(e) => { e.stopPropagation(); handleButtonSwipe("right"); }}
            aria-label={`Connect with ${displayName}`}
          >
            <Heart className="h-7 w-7 fill-current" />
          </Button>
        </div>
      )}
    </div>
  );
});

SwipeDiscoveryCard.displayName = "SwipeDiscoveryCard";
