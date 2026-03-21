import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/BottomNav";
import { EducationBadge } from "@/components/EducationBadge";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { MessageCircle, LogOut, Settings, MapPin, Users, Heart, Flame, Zap, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { useLearningStats, getLevelName } from "@/hooks/useLearningStats";

interface UserBadge {
  module_id: string;
  education_modules: { slug: string; title: string; };
}

const relationshipStyleLabels: Record<string, string> = {
  polyamory: "Polyamorous", "open-relationship": "Open Relationship", swinging: "Swinging",
  "relationship-anarchy": "Relationship Anarchist", monogamish: "Monogamish", exploring: "Exploring ENM",
};

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [userPhotos, setUserPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { stats } = useLearningStats();

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const [profileResult, badgesResult, photosResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
        supabase.from("user_badges").select("module_id, education_modules (slug, title)").eq("user_id", session.user.id),
        supabase.from("user_photos").select("*").eq("user_id", session.user.id).eq("visibility", "public").eq("moderation_status", "approved").order("order_index", { ascending: true })
      ]);
      if (profileResult.error) throw profileResult.error;
      setProfile(profileResult.data);
      setBadges(badgesResult.data || []);
      setUserPhotos(photosResult.data || []);
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => navigate("/settings")}>
            <Settings className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <main className="flex-1 container max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Profile Card */}
        <Card className="overflow-hidden animate-fade-in">
          <div className="relative h-64 bg-gradient-to-br from-primary/20 to-secondary/20">
            {profile?.profile_image ? (
              <img src={profile.profile_image} alt={profile?.name} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Heart className="h-16 w-16 text-primary/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            {/* Badges with shimmer */}
            <div className="absolute top-3 left-3 flex items-center gap-1">
              {badges.slice(0, 5).map((badge, idx) => (
                <div key={badge.module_id} className="animate-stagger-fade" style={{ animationDelay: `${idx * 100}ms` }}>
                  <EducationBadge
                    moduleSlug={(badge.education_modules as any)?.slug || ''}
                    title={(badge.education_modules as any)?.title || ''}
                    isEarned={true} size="sm"
                  />
                </div>
              ))}
              {badges.length > 5 && (
                <span className="text-xs text-white bg-black/40 rounded-full px-1.5 py-0.5">+{badges.length - 5}</span>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <h2 className="text-3xl font-bold flex items-center gap-2">
                {profile?.name}, {profile?.age}
                {profile?.is_verified && <ShieldCheck className="h-6 w-6 text-green-400" />}
              </h2>
              <div className="flex items-center gap-2 text-sm opacity-90">
                {profile?.pronouns && <span className="bg-white/20 px-2 py-0.5 rounded">{profile.pronouns}</span>}
                {profile?.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.location}</span>}
              </div>
            </div>

            {userPhotos.length > 1 && (
              <div className="px-4 py-3 border-t border-border">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {userPhotos.map((photo) => (
                    <img key={photo.id} src={photo.photo_url} alt="Profile photo"
                      className="h-16 w-16 rounded-lg object-cover flex-shrink-0 border border-border" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Learning Stats with animated counters */}
          {stats && (
            <div className="flex items-center gap-4 px-4 py-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-accent" />
                <span className="text-sm font-bold"><AnimatedCounter end={stats.total_xp} suffix=" XP" /></span>
              </div>
              <div className="text-sm text-muted-foreground">
                Lv.<AnimatedCounter end={stats.current_level} /> {getLevelName(stats.current_level)}
              </div>
              {stats.current_streak > 0 && (
                <div className="flex items-center gap-1 ml-auto">
                  <Flame className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold"><AnimatedCounter end={stats.current_streak} suffix="d" /></span>
                </div>
              )}
            </div>
          )}
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {profile?.relationship_style && (
                <Badge variant="outline" className="border-secondary text-secondary">
                  <Users className="h-3 w-3 mr-1" />{relationshipStyleLabels[profile.relationship_style] || profile.relationship_style}
                </Badge>
              )}
              {profile?.relationship_status && <Badge variant="outline">{profile.relationship_status}</Badge>}
              {profile?.experience_level && <Badge variant="secondary">{profile.experience_level}</Badge>}
            </div>
            {profile?.bio && <p className="text-foreground">{profile.bio}</p>}
            {profile?.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {profile.interests.map((interest: string, idx: number) => (
                  <Badge key={interest} variant="secondary" className="text-xs animate-stagger-fade" style={{ animationDelay: `${idx * 50}ms` }}>
                    {interest}
                  </Badge>
                ))}
              </div>
            )}
            {profile?.boundaries && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-1">Boundaries & Preferences</p>
                <p className="text-sm text-muted-foreground">{profile.boundaries}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
            onClick={() => navigate("/profile/edit")}
          >
            <Settings className="mr-2 h-5 w-5" />Edit Profile
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-left text-destructive hover:text-destructive transition-all hover:-translate-y-0.5 hover:shadow-md"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-5 w-5" />Sign Out
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
