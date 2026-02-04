import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EducationBadge } from "@/components/EducationBadge";
import { Heart, MapPin, Users } from "lucide-react";

interface ProfileBadge {
  moduleSlug: string;
  title: string;
}

interface ProfileCardProps {
  profile: {
    id: string;
    name: string;
    age: number;
    pronouns?: string;
    bio?: string;
    profile_image?: string;
    location?: string;
    relationship_style?: string;
    relationship_status?: string;
    looking_for?: string;
    interests?: string[];
    experience_level?: string;
  };
  badges: ProfileBadge[];
  compatibilityScore?: number;
  onClick?: () => void;
}

const relationshipStyleLabels: Record<string, string> = {
  polyamory: "Polyamorous",
  "open-relationship": "Open Relationship",
  swinging: "Swinging",
  "relationship-anarchy": "Relationship Anarchist",
  monogamish: "Monogamish",
  exploring: "Exploring ENM",
};

const lookingForLabels: Record<string, string> = {
  dating: "Dating",
  friends: "Friends",
  "play-partners": "Play Partners",
  community: "Community",
  events: "Events",
};

export const ProfileCard = ({ 
  profile, 
  badges, 
  compatibilityScore,
  onClick 
}: ProfileCardProps) => {
  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-64 bg-gradient-to-br from-primary/20 to-secondary/20">
        {profile.profile_image ? (
          <img
            src={profile.profile_image}
            alt={profile.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Heart className="h-16 w-16 text-primary/30" />
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Compatibility score */}
        {compatibilityScore !== undefined && (
          <div className="absolute top-3 right-3 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
            {compatibilityScore}% match
          </div>
        )}

        {/* Badges row */}
        <div className="absolute top-3 left-3 flex gap-1">
          {badges.slice(0, 5).map((badge) => (
            <EducationBadge
              key={badge.moduleSlug}
              moduleSlug={badge.moduleSlug}
              title={badge.title}
              isEarned={true}
              size="sm"
            />
          ))}
        </div>

        {/* Basic info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-2xl font-bold">
            {profile.name}, {profile.age}
          </h3>
          <div className="flex items-center gap-2 text-sm opacity-90">
            {profile.pronouns && (
              <span className="bg-white/20 px-2 py-0.5 rounded">
                {profile.pronouns}
              </span>
            )}
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {profile.location}
              </span>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Relationship info */}
        <div className="flex flex-wrap gap-2">
          {profile.relationship_style && (
            <Badge variant="outline" className="border-secondary text-secondary">
              <Users className="h-3 w-3 mr-1" />
              {relationshipStyleLabels[profile.relationship_style] || profile.relationship_style}
            </Badge>
          )}
          {profile.relationship_status && (
            <Badge variant="outline">
              {profile.relationship_status}
            </Badge>
          )}
        </div>

        {/* Looking for */}
        {profile.looking_for && (
          <p className="text-sm text-muted-foreground">
            Looking for: {lookingForLabels[profile.looking_for] || profile.looking_for}
          </p>
        )}

        {/* Bio preview */}
        {profile.bio && (
          <p className="text-sm line-clamp-2">{profile.bio}</p>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {profile.interests.slice(0, 4).map((interest) => (
              <Badge key={interest} variant="secondary" className="text-xs">
                {interest}
              </Badge>
            ))}
            {profile.interests.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{profile.interests.length - 4}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};