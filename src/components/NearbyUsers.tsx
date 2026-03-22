import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NearbyUser {
  user_id: string;
  distance: number;
  updated_at: string;
}

interface NearbyProfile {
  user_id: string;
  name: string;
  profile_image: string | null;
  display_name: string | null;
  distance: number;
  lastSeen: string;
}

function formatDistance(meters: number): string {
  if (meters < 100) return "< 100m away";
  if (meters < 1000) return `${Math.round(meters)}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

interface NearbyUsersProps {
  nearbyUsers: NearbyUser[];
  isSharing: boolean;
}

export const NearbyUsers = ({ nearbyUsers, isSharing }: NearbyUsersProps) => {
  const [profiles, setProfiles] = useState<NearbyProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSharing || nearbyUsers.length === 0) {
      setProfiles([]);
      return;
    }

    const loadProfiles = async () => {
      setLoading(true);
      const userIds = nearbyUsers.map((u) => u.user_id);

      // Use RPC to get public profiles safely
      const results: NearbyProfile[] = [];
      for (const nu of nearbyUsers) {
        const { data } = await supabase.rpc("get_public_profile", { _user_id: nu.user_id });
        if (data && data.length > 0) {
          const p = data[0];
          results.push({
            user_id: nu.user_id,
            name: p.display_name || p.name,
            profile_image: p.profile_image,
            display_name: p.display_name,
            distance: nu.distance,
            lastSeen: nu.updated_at,
          });
        }
      }
      setProfiles(results);
      setLoading(false);
    };

    loadProfiles();
  }, [nearbyUsers, isSharing]);

  if (!isSharing) return null;

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" />
          Nearby People
          {nearbyUsers.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {nearbyUsers.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Finding nearby people…
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No one nearby right now</p>
            <p className="text-xs mt-1">People sharing their location within 500m will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {profiles.map((p, idx) => (
              <div
                key={p.user_id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all animate-stagger-fade",
                  "hover:bg-accent/50"
                )}
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={p.profile_image || undefined} alt={p.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {p.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {formatDistance(p.distance)}
                    <span>•</span>
                    {timeAgo(p.lastSeen)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
