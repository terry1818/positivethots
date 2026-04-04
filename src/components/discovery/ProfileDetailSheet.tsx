import { useState, useEffect } from "react";
import { BlurImage } from "@/components/BlurImage";
import { Heart, X, Star, Shield, ChevronLeft, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ProfilePromptsDisplay } from "@/components/profile/ProfilePrompts";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

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
  verified?: boolean;
  distance?: number | null;
  is_boosted?: boolean;
  photo_focal_points?: Record<string, number>;
}

interface ProfileDetailSheetProps {
  profile: EnhancedProfile | null;
  onClose: () => void;
  onConnect: (id: string) => void;
  onPass: (id: string) => void;
  onSuperLike?: (id: string) => void;
  canSuperLike?: boolean;
}

export const ProfileDetailSheet = ({
  profile,
  onClose,
  onConnect,
  onPass,
  onSuperLike,
  canSuperLike,
}: ProfileDetailSheetProps) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(new Set());

  // Fetch approved photos from user_photos table (same source as discovery cards)
  const { data: userPhotos } = useQuery({
    queryKey: ["profile-detail-photos", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from("user_photos")
        .select("photo_url, order_index")
        .eq("user_id", profile.id)
        .eq("visibility", "public")
        .eq("moderation_status", "approved")
        .order("order_index", { ascending: true });
      return data?.map(p => p.photo_url) || [];
    },
    enabled: !!profile?.id,
  });

  useEffect(() => {
    setPhotoIndex(0);
    setFailedPhotos(new Set());
  }, [profile?.id]);

  if (!profile) return null;

  // Use fetched user_photos as primary source, fall back to profile data
  const fetchedPhotos = userPhotos && userPhotos.length > 0 ? userPhotos : [profile.profile_image, ...(profile.photos || [])].filter(Boolean) as string[];
  const photos = fetchedPhotos.filter(url => !failedPhotos.has(url));

  const handlePhotoError = (url: string) => {
    setFailedPhotos(prev => {
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  };

  // Clamp index
  const safePhotoIndex = photos.length > 0 ? Math.min(photoIndex, photos.length - 1) : 0;
  const displayName = profile.display_name || profile.name;
  const badgeCount = profile.badge_count || 0;

  return (
    <Drawer open={!!profile} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="max-h-[92vh] overflow-hidden">
        <DrawerTitle className="sr-only">{displayName}'s Profile</DrawerTitle>
        <DrawerDescription className="sr-only">View full profile details</DrawerDescription>

        <div className="overflow-y-auto flex-1">
          {/* Photo carousel */}
          <div className="relative h-56 w-full overflow-hidden">
            {photos.length > 0 ? (
              <BlurImage
                src={photos[safePhotoIndex] || "/placeholder.svg"}
                alt={displayName}
                className="h-full w-full"
                loading="eager"
                onError={() => handlePhotoError(photos[safePhotoIndex])}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-5xl font-bold text-primary-foreground">{displayName?.[0] || "?"}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            {/* Dot indicators */}
            {photos.length > 1 && (
              <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 z-10">
            {photos.slice(0, 6).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 rounded-full transition-all",
                      i === safePhotoIndex ? "w-4 bg-white" : "w-2 bg-white/70 ring-1 ring-white/50"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Tap zones */}
            <button
              className="absolute top-0 left-0 w-1/3 h-full z-10"
              onClick={() => setPhotoIndex(i => Math.max(0, i - 1))}
              aria-label="Previous photo"
            />
            <button
              className="absolute top-0 right-0 w-2/3 h-full z-10"
              onClick={() => setPhotoIndex(i => Math.min(photos.length - 1, i + 1))}
              aria-label="Next photo"
            />

            {/* Back button */}
            <button
              onClick={onClose}
              className="absolute top-3 left-3 z-20 h-8 w-8 rounded-full bg-black/40 flex items-center justify-center text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Compatibility badge over photo */}
            {profile.compatibility_score != null && profile.compatibility_score > 0 && (
              <div className="absolute top-3 right-3 z-20">
                <Badge className="bg-primary/90 text-primary-foreground text-sm font-bold">
                  {profile.compatibility_score}% Match
                </Badge>
              </div>
            )}
          </div>

          {/* Profile content */}
          <div className="p-4 space-y-5">
            {/* Name & basics */}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{displayName}, {profile.age}</h2>
                {profile.verified && (
                  <Shield className="h-4 w-4 text-success" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                {profile.pronouns && <span>{profile.pronouns}</span>}
                {profile.pronouns && profile.location && <span>·</span>}
                {profile.location && (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" /> {profile.location}
                  </span>
                )}
              </div>
            </div>

            {/* Compatibility section */}
            {profile.compatibility_score != null && profile.compatibility_score > 0 && (
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Compatibility</p>
                <div className="flex items-center gap-2 mb-2">
                  <Progress value={profile.compatibility_score} className="h-2 flex-1" />
                  <span className="text-sm font-bold text-primary">{profile.compatibility_score}%</span>
                </div>
                {profile.compatibility_reasons && profile.compatibility_reasons.length > 0 && (
                  <div className="space-y-1">
                    {profile.compatibility_reasons.slice(0, 3).map((reason, i) => (
                      <p key={i} className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Heart className="h-3 w-3 text-primary shrink-0" /> {reason}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Education badges */}
            {badgeCount > 0 && (
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Education Badges ({badgeCount})
                </p>
                {badgeCount >= 20 && (
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 mb-2">
                    🏅 Verified Educator
                  </Badge>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: Math.min(badgeCount, 8) }).map((_, i) => (
                    <Badge key={i} variant="secondary" className="text-sm">
                      ✓ Module {i + 1}
                    </Badge>
                  ))}
                  {badgeCount > 8 && (
                    <Badge variant="outline" className="text-sm text-muted-foreground">
                      +{badgeCount - 8} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Prompts */}
            <ProfilePromptsDisplay userId={profile.id} />

            {/* About */}
            {profile.bio && (
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">About</p>
                <p className="text-sm text-foreground">{profile.bio}</p>
              </div>
            )}

            {/* Relationship style */}
            {(profile.relationship_style || profile.looking_for) && (
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Relationship Style
                </p>
                {profile.relationship_style && (
                  <Badge variant="secondary" className="mb-1.5">
                    {profile.relationship_style.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </Badge>
                )}
                {profile.looking_for && (
                  <p className="text-sm text-muted-foreground">Looking for: {profile.looking_for}</p>
                )}
              </div>
            )}

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((interest, i) => (
                    <Badge key={i} variant="outline" className="text-sm">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Extra spacing for sticky footer */}
            <div className="h-20" />
          </div>
        </div>

        {/* Sticky action bar */}
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t flex items-center justify-center gap-4">
          <Button
            variant="outline"
            className="h-12 w-12 rounded-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => { onPass(profile.id); onClose(); }}
          >
            <X className="h-5 w-5" />
          </Button>

          {canSuperLike && (
            <Button
              variant="outline"
              className="h-10 w-10 rounded-full border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
              onClick={() => { onSuperLike?.(profile.id); onClose(); }}
            >
              <Star className="h-4 w-4" />
            </Button>
          )}

          <Button
            className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground hover:scale-105 transition-transform shadow-lg"
            onClick={() => { onConnect(profile.id); onClose(); }}
          >
            <Heart className="h-6 w-6 fill-current" />
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
