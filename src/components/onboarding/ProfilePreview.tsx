import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Ruler, Star } from "lucide-react";

interface ProfilePreviewProps {
  name: string;
  age?: number;
  pronouns: string;
  gender: string;
  sexuality: string;
  relationshipStyle: string;
  location: string;
  bio: string;
  interests: string[];
  desires: string[];
  heightCm: number | null;
  zodiacSign: string;
  profileImage?: string | null;
}

export const ProfilePreview = (props: ProfilePreviewProps) => {
  const cmToFeetInches = (cm: number) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  };

  return (
    <Card className="overflow-hidden shadow-[var(--shadow-elevated)]">
      {/* Photo placeholder */}
      <div className="h-48 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
        {props.profileImage ? (
          <img src={props.profileImage} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Your photos will appear here</p>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Name, age, pronouns */}
        <div>
          <h3 className="text-xl font-bold text-foreground">
            {props.name}{props.age ? `, ${props.age}` : ""}
          </h3>
          <p className="text-sm text-muted-foreground">{props.pronouns}</p>
        </div>

        {/* Key details */}
        <div className="flex flex-wrap gap-2">
          {props.gender && (
            <Badge variant="secondary" className="text-sm">{props.gender}</Badge>
          )}
          {props.sexuality && (
            <Badge variant="secondary" className="text-sm">{props.sexuality}</Badge>
          )}
          {props.relationshipStyle && (
            <Badge variant="outline" className="text-sm">{props.relationshipStyle}</Badge>
          )}
        </div>

        {/* Location & height */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          {props.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {props.location}
            </span>
          )}
          {props.heightCm && (
            <span className="flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" /> {cmToFeetInches(props.heightCm)}
            </span>
          )}
          {props.zodiacSign && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5" /> {props.zodiacSign}
            </span>
          )}
        </div>

        {/* Bio */}
        {props.bio && (
          <p className="text-sm text-foreground line-clamp-3">{props.bio}</p>
        )}

        {/* Desires */}
        {props.desires.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {props.desires.slice(0, 6).map(d => (
              <Badge key={d} className="text-sm bg-secondary/15 text-secondary border-0">{d}</Badge>
            ))}
          </div>
        )}

        {/* Interests */}
        {props.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {props.interests.slice(0, 5).map(i => (
              <Badge key={i} variant="outline" className="text-sm">{i}</Badge>
            ))}
            {props.interests.length > 5 && (
              <Badge variant="outline" className="text-sm">+{props.interests.length - 5}</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
