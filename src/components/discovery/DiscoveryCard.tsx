import { memo, useState } from "react";
import { BlurImage } from "@/components/BlurImage";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLevelName, getLevelEmoji } from "@/hooks/useLearningStats";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Clock, Users, Shield, BookOpen, Star, Rocket, Award, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { VerifiedBadgeOverlay } from "@/components/VerifiedBadgeOverlay";
import { EducationTierBadge } from "@/components/EducationTierBadge";
import { BadgeCredibilitySheet } from "@/components/BadgeCredibilitySheet";

interface DiscoveryProfile {
  id: string;
  name: string;
  age: number;
  bio: string | null;
  profile_image: string | null;
  pronouns: string | null;
  relationship_style: string | null;
  relationship_status: string | null;
  interests: string[] | null;
  compatibility_score?: number;
  compatibility_reasons?: string[];
  badge_count?: number;
  last_active?: string;
  verified?: boolean;
  distance?: number | null;
  is_boosted?: boolean;
  learning_level?: number;
}

interface DiscoveryCardProps {
  profile: DiscoveryProfile;
  index: number;
  onConnect: (id: string) => void;
  onPass: (id: string) => void;
  onSuperLike?: (id: string) => void;
  canSuperLike?: boolean;
  superLikeBalance?: number;
}

export const DiscoveryCard = memo(({ profile, index, onConnect, onPass, onSuperLike, canSuperLike, superLikeBalance }: DiscoveryCardProps) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [badgeSheetOpen, setBadgeSheetOpen] = useState(false);

  const handleSuperLikeClick = () => {
    if (superLikeBalance !== undefined && superLikeBalance <= 0) {
      toast("No Thots left!", {
        description: "Get more to stand out.",
        action: {
          label: "Get More",
          onClick: () => navigate("/premium"),
        },
      });
      return;
    }
    onSuperLike?.(profile.id);
  };

  return (
  <>
  <Card
    className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-stagger-fade cursor-pointer"
    style={{ animationDelay: `${index * 80}ms` }}
    onClick={() => navigate("/profile/" + profile.id)}
  >
    <div className="relative h-64 bg-muted">
       {profile.profile_image && !imageError ? (
        <BlurImage
          src={profile.profile_image}
          alt={profile.name}
          className="w-full h-full"
          loading={index === 0 ? "eager" : "lazy"}
          fetchPriority={index === 0 ? "high" : undefined}
          sizes="(max-width: 375px) 343px, (max-width: 768px) 500px, 600px"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
          {profile.name?.[0] || "?"}
        </div>
      )}
      <div className="absolute top-3 left-3 flex gap-2">
        {profile.is_boosted && (
          <Badge className="bg-accent text-accent-foreground animate-pulse">
            <Rocket className="h-3 w-3 mr-1" />Boosted
          </Badge>
        )}
        {profile.verified && (
          <Badge className="bg-primary text-primary-foreground">
            <Shield className="h-3 w-3 mr-1" />Verified
          </Badge>
        )}
        {profile.badge_count && profile.badge_count >= 20 && (
          <Badge className="bg-amber-500/90 text-white">
            <Award className="h-3 w-3 mr-1" />Verified Educator
          </Badge>
        )}
        {profile.badge_count && profile.badge_count >= 10 && profile.badge_count < 20 && (
          <Badge className="bg-secondary text-secondary-foreground">
            <BookOpen className="h-3 w-3 mr-1" />Educator
          </Badge>
        )}
      </div>
      {profile.compatibility_score != null && (
        <div className="absolute top-3 right-3">
          <div className="bg-background/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4 text-primary fill-primary" />
              <span className="text-sm font-bold">{profile.compatibility_score}%</span>
            </div>
          </div>
        </div>
      )}
      {(profile.distance != null || profile.last_active) && (
        <div className="absolute bottom-3 left-3 right-3 flex justify-between">
          {profile.distance != null && (
            <Badge variant="secondary" className="bg-background/95 backdrop-blur-sm">
              <MapPin className="h-3 w-3 mr-1" />{profile.distance} mi
            </Badge>
          )}
          {profile.last_active && (
            <Badge variant="secondary" className="bg-background/95 backdrop-blur-sm">
              <Clock className="h-3 w-3 mr-1" />{profile.last_active}
            </Badge>
          )}
        </div>
      )}
      {/* Verified badge overlay on photo */}
      {profile.verified && (
        <div className="absolute bottom-3 right-3 z-10 drop-shadow-[0_1px_3px_rgba(255,255,255,0.4)]">
          <VerifiedBadgeOverlay isVerified size="md" />
        </div>
      )}
    </div>

    <div className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-xl font-bold">{profile.name}, {profile.age}</h3>
            {profile.badge_count != null && profile.badge_count >= 5 && (
              <>
                <EducationTierBadge badgeCount={profile.badge_count} size="sm" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setBadgeSheetOpen(true); }}
                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Badge info"
                >
                  <Info className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          {profile.pronouns && <p className="text-sm text-muted-foreground">{profile.pronouns}</p>}
          {profile.learning_level && profile.learning_level > 1 && (
            <Badge variant="secondary" className="text-sm mt-0.5">
              {getLevelName(profile.learning_level)} {getLevelEmoji(profile.learning_level)}
            </Badge>
          )}
        </div>
        {profile.relationship_status === "couple" && (
          <Badge variant="outline"><Users className="h-3 w-3 mr-1" />Couple</Badge>
        )}
      </div>

      {/* Compatibility reasons */}
      {profile.compatibility_reasons && profile.compatibility_reasons.length > 0 && (profile.compatibility_score ?? 0) >= 50 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {profile.compatibility_reasons.slice(0, 2).map((reason, i) => (
            <span key={i} className="text-sm bg-muted/80 text-muted-foreground rounded-full px-2 py-0.5">
              {reason}
            </span>
          ))}
        </div>
      )}

      {profile.relationship_style && (
        <Badge className="mb-3" variant="secondary">{profile.relationship_style}</Badge>
      )}
      {profile.bio && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{profile.bio}</p>
      )}
      {profile.interests && profile.interests.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {profile.interests.slice(0, 4).map((interest, i) => (
            <Badge key={i} variant="outline" className="text-sm">{interest}</Badge>
          ))}
          {profile.interests.length > 4 && (
            <Badge variant="outline" className="text-sm">+{profile.interests.length - 4}</Badge>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); onPass(profile.id); }}>
          Pass
        </Button>
        {canSuperLike && onSuperLike && (
          <Button
            variant="outline"
            size="icon"
            className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
            onClick={(e) => { e.stopPropagation(); handleSuperLikeClick(); }}
            title={superLikeBalance !== undefined ? `${superLikeBalance} Thots left` : "Send a Thot"}
          >
            <Star className="h-4 w-4 fill-current" />
          </Button>
        )}
        <Button
          className="flex-1 bg-gradient-primary text-primary-foreground animate-pulse-glow"
          onClick={(e) => { e.stopPropagation(); onConnect(profile.id); }}
        >
          <Heart className="h-4 w-4 mr-2" />Connect
        </Button>
      </div>
    </div>
   </Card>
   <BadgeCredibilitySheet
     open={badgeSheetOpen}
     onOpenChange={setBadgeSheetOpen}
     moduleSlug="consent-fundamentals"
     title="Education Badges"
     tier="foundation"
   />
   </>
  );
});

DiscoveryCard.displayName = "DiscoveryCard";
