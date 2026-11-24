import { useState, useRef, useEffect, memo, useCallback } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BlurImage } from "@/components/BlurImage";
import { Heart, X, Star, Zap, Shield, ChevronUp, RefreshCw, Lock, CircleHelp, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { EducationTierBadge } from "@/components/EducationTierBadge";
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
  is_mentor?: boolean;
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
  onAllImagesFailed?: () => void;
}

/** How long a card takes to leave, and how far up it must be pulled to send a Thot. */
const EXIT_MS = 320;
const THOT_PULL = 130;
const exitTransforms = {
  left: "translateX(-150%) rotate(-22deg)",
  right: "translateX(150%) rotate(22deg)",
  up: "translateY(-120%) scale(1.04)",
} as const;

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
  onAllImagesFailed,
}: SwipeDiscoveryCardProps) => {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [animate, setAnimate] = useState<"left" | "right" | "up" | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(new Set());
  const cardRef = useRef<HTMLDivElement>(null);
  // True once the pointer has travelled far enough to be a drag, so the release is not also a tap.
  const draggedRef = useRef(false);
  const reducedMotion = useReducedMotion();
  // "Can send Thots" (the plan allows it) is not the same as having one left right now.
  const hasThot = !!canSuperLike && superLikeBalance > 0;

  const allPhotos = [profile.profile_image, ...(profile.photos || [])].filter(Boolean) as string[];
  const photos = allPhotos.filter(url => !failedPhotos.has(url));

  const handlePhotoError = useCallback((url: string) => {
    setFailedPhotos(prev => {
      const next = new Set(prev);
      next.add(url);
      // If all photos have failed, notify parent to remove this profile
      const remainingPhotos = allPhotos.filter(u => !next.has(u));
      if (remainingPhotos.length === 0) {
        onAllImagesFailed?.();
      }
      return next;
    });
  }, [allPhotos, onAllImagesFailed]);

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

  // Drag handlers. The live position is kept in a ref so the release reads where the card really is,
  // and so a pointer that is only hovering (not pressed) never counts as a drag.
  const dragRef = useRef({ active: false, startX: 0, startY: 0, x: 0, y: 0 });

  const leave = useCallback((direction: "left" | "right" | "up") => {
    setAnimate(direction);
    try { navigator?.vibrate?.([30]); } catch {}
    setTimeout(() => {
      if (direction === "right") onConnect(profile.id);
      else if (direction === "left") onPass(profile.id);
      else onSuperLike?.(profile.id);
    }, EXIT_MS);
  }, [onConnect, onPass, onSuperLike, profile.id]);

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    if (!isTop) return;
    dragRef.current = { active: true, startX: clientX, startY: clientY, x: 0, y: 0 };
    draggedRef.current = false;
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(true);
  }, [isTop]);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    const drag = dragRef.current;
    if (!isTop || !drag.active) return;
    drag.x = clientX - drag.startX;
    drag.y = clientY - drag.startY;
    if (Math.abs(drag.x) + Math.abs(drag.y) > 10) draggedRef.current = true;
    setDragOffset({ x: drag.x, y: drag.y });
  }, [isTop]);

  const handleDragEnd = useCallback(() => {
    const drag = dragRef.current;
    if (!isTop || !drag.active) return;
    drag.active = false;
    setIsDragging(false);
    const threshold = 100;
    if (hasThot && drag.y < -THOT_PULL && Math.abs(drag.x) < threshold) {
      // Straight up, a long way: Send a Thot (only when there is one to send).
      leave("up");
    } else if (Math.abs(drag.x) > threshold) {
      leave(drag.x > 0 ? "right" : "left");
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  }, [isTop, hasThot, leave]);

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
  }, [isTop, handleDragStart, handleDragMove, handleDragEnd]);

  const handleButtonSwipe = (direction: "left" | "right") => {
    if (!isTop || animate) return;
    leave(direction);
  };

  const handleSuperLikeTap = () => {
    if (!isTop || animate) return;
    leave("up");
  };

  const rotation = isDragging && !reducedMotion ? dragOffset.x / 20 : 0;
  const dragX = isDragging ? dragOffset.x : 0;
  const dragY = isDragging ? dragOffset.y : 0;
  // Which way the card is being pulled, and how far (0 to 1), for the stamp that names the action.
  const pullingUp = hasThot && dragY < -40 && Math.abs(dragX) < 100;
  const connectPull = pullingUp ? 0 : Math.max(0, Math.min(dragX / 100, 1));
  const passPull = pullingUp ? 0 : Math.max(0, Math.min(-dragX / 100, 1));
  const thotPull = pullingUp ? Math.min(Math.abs(dragY) / THOT_PULL, 1) : 0;

  // Stack transforms
  const stackTransforms: Record<number, string> = {
    0: "",
    1: "scale(0.95) translateY(10px)",
    2: "scale(0.9) translateY(20px)",
  };
  const stackZ: Record<number, number> = { 0: 30, 1: 20, 2: 10 };

  const displayName = profile.display_name || profile.name;
  const badges = profile.badge_count ?? 0;
  const relationshipStyle = profile.relationship_style
    ? profile.relationship_style.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    : null;
  const tap = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (draggedRef.current) return;
    action();
  };

  return (
    <>
      <div
        ref={cardRef}
        className="discover-card-slot"
        style={{
          // Leaving: the card carries on from wherever it was let go. Under reduced motion it only fades.
          transform: animate
            ? (reducedMotion ? "" : exitTransforms[animate])
            : isDragging
              ? `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`
              : stackTransforms[stackIndex] || "",
          opacity: animate ? 0 : 1,
          transition: isDragging
            ? "none"
            : animate
              ? `transform ${EXIT_MS}ms ease-in, opacity ${EXIT_MS}ms ease-in`
              : "transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          cursor: isTop ? "grab" : "default",
          zIndex: stackZ[stackIndex] || 1,
          pointerEvents: isTop && !animate ? "auto" : "none",
        }}
        aria-hidden={isTop ? undefined : true}
        data-walkthrough={isTop ? "discovery-card" : undefined}
        data-tour={isTop ? "discovery-card" : undefined}
        onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* The arrival animation is on the card, not the slot: a finished animation on the slot would
            hold its transform and the card would no longer follow the finger. */}
        <article className={cn("kit-card discover-card", !animate && stackIndex === 0 && "animate-card-enter")} aria-label={`${displayName}, ${profile.age}`}>
          {/* Photo */}
          <div className="discover-photo">
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
            <div className="discover-photo-shade" />

            {/* Which photo is showing */}
            {photos.length > 1 && (
              <div className="absolute top-2 left-3 right-3 flex gap-1 z-10" aria-hidden="true">
                {photos.slice(0, 6).map((_, i) => (
                  <div key={i} className={cn("h-1 flex-1 rounded-full", i === photoIndex ? "bg-white" : "bg-white/40")} />
                ))}
              </div>
            )}

            {/* Tapping the photo: step through the photos, or open the full profile when there is only one. */}
            {photos.length > 1 ? (
              <>
                <button
                  type="button"
                  className="absolute top-0 left-0 w-1/3 h-full z-10"
                  onClick={tap(() => setPhotoIndex(i => Math.max(0, i - 1)))}
                  aria-label="Previous photo"
                />
                <button
                  type="button"
                  className="absolute top-0 right-0 w-2/3 h-full z-10"
                  onClick={tap(() => setPhotoIndex(i => Math.min(photos.length - 1, i + 1)))}
                  aria-label="Next photo"
                />
              </>
            ) : (
              <button
                type="button"
                className="absolute inset-0 z-10"
                onClick={tap(onViewProfile)}
                aria-label={`View full profile of ${displayName}`}
              />
            )}

            {/* The action a pull will take, named before the card is let go. Shape and words, not colour alone. */}
            {isDragging && (
              <>
                <div className="discover-stamp top-16 left-5 -rotate-12" style={{ opacity: connectPull, background: "hsl(var(--kit-discover-bottom))" }}>
                  <Heart fill="currentColor" /> Connect
                </div>
                <div className="discover-stamp top-16 right-5 rotate-12" style={{ opacity: passPull, background: "hsl(0 0% 28%)" }}>
                  <X /> Pass
                </div>
                <div className="discover-stamp top-1/3 left-1/2 -translate-x-1/2 whitespace-nowrap" style={{ opacity: thotPull, background: "hsl(var(--path-gold-dark))" }}>
                  <Star fill="currentColor" /> Send a Thot
                </div>
              </>
            )}

            {/* Trust signals, top left */}
            <div className={cn("absolute left-3 flex flex-wrap gap-1.5 z-10 pointer-events-none max-w-[60%]", photos.length > 1 ? "top-5" : "top-3")}>
              {profile.verified && (
                <span className="kit-chip" data-tone="correct"><Shield className="h-3.5 w-3.5" aria-hidden="true" /> Verified</span>
              )}
              {profile.is_boosted && (
                <span className="kit-chip"><Zap className="h-3.5 w-3.5" aria-hidden="true" /> Boosted</span>
              )}
              {profile.is_mentor && (
                <span className="kit-chip" data-tone="area"><GraduationCap className="h-3.5 w-3.5" aria-hidden="true" /> Mentor</span>
              )}
              {isTop && is_recycled && (
                <span className="kit-chip" data-tone="glass" aria-label="Previously viewed profile">
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Second look
                </span>
              )}
            </div>

            {/* Compatibility, top right */}
            {profile.compatibility_score != null && profile.compatibility_score > 0 && (
              <div className={cn("absolute right-3 z-20", photos.length > 1 ? "top-5" : "top-3")} data-walkthrough="compatibility-score" data-tour="compatibility-score">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="kit-chip relative cursor-help after:absolute after:-inset-3 after:content-['']"
                      data-tone="area"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {profile.compatibility_score}% Compatible
                      <CircleHelp className="hidden h-3.5 w-3.5 min-[360px]:block" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[240px] text-center">
                    Based on shared interests, relationship style, goals, badges, and location.
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* Who this is */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 text-white z-10 pointer-events-none">
              <div className="flex items-center gap-3">
                <ProfileFrame frameId={(profile as any).selected_frame} size="sm">
                  {photos.length > 0 ? (
                    <BlurImage
                      src={photos[0]}
                      alt=""
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
                  <h2 className="text-2xl font-extrabold leading-tight truncate">
                    {displayName}, {profile.age}
                  </h2>
                  {profile.pronouns && <p className="text-sm text-white/85">{profile.pronouns}</p>}
                </div>
              </div>
              {(relationshipStyle || badges > 0) && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {/* What they have learned shows on every card: the tier badge from 5 badges, a count before that. */}
                  {badges >= 5 && <EducationTierBadge badgeCount={badges} size="sm" />}
                  {badges > 0 && badges < 5 && (
                    <span className="kit-chip" data-tone="glass"><GraduationCap className="h-3.5 w-3.5" aria-hidden="true" /> {badges} {badges === 1 ? "badge" : "badges"}</span>
                  )}
                  {relationshipStyle && <span className="kit-chip" data-tone="glass">{relationshipStyle}</span>}
                </div>
              )}
            </div>
          </div>

          {/* A few lines about them. Tapping opens the full profile. */}
          <button
            type="button"
            className="w-full shrink-0 text-left px-4 pt-2.5 pb-2 space-y-1"
            onClick={tap(onViewProfile)}
            aria-label={`View full profile of ${displayName}`}
          >
            {profile.bio && <p className="discover-bio text-sm text-foreground/90 line-clamp-2 [text-wrap:pretty]">{profile.bio}</p>}
            {profile.compatibility_reasons?.slice(0, 2).map((reason, i) => (
              <p key={i} className="discover-reason kit-text text-sm font-semibold flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> <span className="truncate">{reason}</span>
              </p>
            ))}
            <span className="flex items-center justify-center gap-1 pt-0.5 text-xs font-bold text-muted-foreground">
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" /> Full profile
            </span>
          </button>
        </article>
      </div>

      {/* The three actions. They stay put while the card moves, under the card where a thumb reaches. */}
      {isTop && (
        <div className="discover-dock" data-walkthrough="action-buttons" data-tour="action-buttons">
          <div className="discover-dock-item">
            <button
              type="button"
              className="kit-action"
              data-tone="quiet"
              onClick={(e) => { e.stopPropagation(); handleButtonSwipe("left"); }}
              aria-label={`Pass on ${displayName}`}
            >
              <X aria-hidden="true" />
            </button>
            <span aria-hidden="true">Pass</span>
          </div>

          <div className="discover-dock-item">
            <button
              type="button"
              className="kit-action"
              data-tone="reward"
              data-locked={!hasThot}
              onClick={(e) => {
                e.stopPropagation();
                if (hasThot) handleSuperLikeTap();
                else onUpgradeSuperLike?.();
              }}
              aria-label={hasThot ? `Send a Thot to ${displayName}` : "Get Thots: none left to send today"}
            >
              <Star fill="currentColor" aria-hidden="true" />
              {hasThot && superLikeBalance < 999 && (
                <span className="kit-action-count" aria-hidden="true">{superLikeBalance}</span>
              )}
              {!hasThot && (
                <span className="kit-action-count" aria-hidden="true"><Lock className="!h-3 !w-3" /></span>
              )}
            </button>
            <span aria-hidden="true">{hasThot ? "Send a Thot" : "Get Thots"}</span>
          </div>

          <div className="discover-dock-item" data-main="true">
            <button
              type="button"
              className="kit-action kit-action-lg"
              onClick={(e) => { e.stopPropagation(); handleButtonSwipe("right"); }}
              aria-label={`Connect with ${displayName}`}
            >
              <Heart fill="currentColor" aria-hidden="true" />
            </button>
            <span aria-hidden="true">Connect</span>
          </div>
        </div>
      )}
    </>
  );
});

SwipeDiscoveryCard.displayName = "SwipeDiscoveryCard";
