import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/BottomNav";
import { EducationBadge } from "@/components/EducationBadge";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { MessageCircle, LogOut, Settings, MapPin, Users, Heart, Flame, Zap, ShieldCheck, BookOpen, CheckCircle, Lock, Rocket, Crown, Award } from "lucide-react";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { useLearningStats, getLevelName } from "@/hooks/useLearningStats";
import { useFeatureUnlocks } from "@/hooks/useFeatureUnlocks";
import { useSubscription } from "@/hooks/useSubscription";
import { PageSkeleton } from "@/components/PageSkeleton";

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
  const [boostLoading, setBoostLoading] = useState(false);
  const [hasActiveBoost, setHasActiveBoost] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [hasPendingPhotos, setHasPendingPhotos] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { stats } = useLearningStats();
  const { tiers } = useFeatureUnlocks();
  const { hasFeature, tier } = useSubscription();

  useEffect(() => {
    if (searchParams.get("boost") === "success") {
      toast.success("Profile Boosted! 🚀", { description: "You'll appear at the top of discovery for 24 hours." });
      checkActiveBoost();
    }
  }, [searchParams]);

  useEffect(() => { loadProfile(); checkActiveBoost(); }, []);

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

  const checkActiveBoost = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from("profile_boosts")
      .select("id")
      .eq("user_id", session.user.id)
      .gt("expires_at", new Date().toISOString())
      .limit(1);
    setHasActiveBoost((data?.length || 0) > 0);
  };

  const handleBoostProfile = async () => {
    // VIP gets one free boost/month — validated server-side
    if (hasFeature("profile_boost")) {
      setBoostLoading(true);
      try {
        const { error } = await supabase.rpc("activate_vip_boost");
        if (error) {
          if (error.message?.includes("already used")) {
            // Fall through to Stripe payment
          } else {
            throw error;
          }
        } else {
          setHasActiveBoost(true);
          toast.success("Profile Boosted! 🚀", { description: "You'll appear at the top of discovery for 24 hours." });
          setBoostLoading(false);
          return;
        }
      } catch (err: any) {
        console.error("VIP boost error:", err);
        toast.error("Failed to activate free boost");
        setBoostLoading(false);
        return;
      }
    }
    // Otherwise pay via Stripe
    setBoostLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-boost-payment");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      console.error("Boost payment error:", err);
      toast.error("Failed to start boost purchase");
    } finally {
      setBoostLoading(false);
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
    return <PageSkeleton variant="profile" />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" showText={false} />
          <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => navigate("/settings")} aria-label="Settings">
            <Settings className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <main className="flex-1 container max-w-md mx-auto px-4 py-6 pb-24 space-y-4">
        {/* Profile Card */}
        <Card className="overflow-hidden animate-fade-in">
          <div className="relative h-64 bg-gradient-to-br from-primary/20 to-secondary/20">
            {profile?.profile_image ? (
              <img src={profile.profile_image} alt={profile?.name} className="absolute inset-0 w-full h-full object-cover" loading="eager" decoding="async" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Heart className="h-16 w-16 text-primary/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            {/* Badges with shimmer */}
            <div className="absolute top-3 left-3 flex items-center gap-1">
              {badges.length >= 20 && (
                <Badge className="bg-amber-500/90 text-white animate-stagger-fade">
                  <Award className="h-3 w-3 mr-1" />Verified Educator
                </Badge>
              )}
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

            <div className="absolute bottom-0 left-0 right-0 p-4 text-primary-foreground">
              <h2 className="text-3xl font-bold flex items-center gap-2">
                {profile?.name}, {profile?.age}
                {profile?.is_verified && <ShieldCheck className="h-6 w-6 text-accent" />}
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
                      className="h-16 w-16 rounded-lg object-cover flex-shrink-0 border border-border"
                      loading="lazy" decoding="async" />
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
            {(profile?.bdsm_test_url || profile?.bdsm_test_screenshot) && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2 flex items-center gap-1">🔗 Kink Profile</p>
                {profile.bdsm_test_url && (
                  <a
                    href={profile.bdsm_test_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline inline-flex items-center gap-1 mb-2"
                  >
                    View BDSMtest Results <Heart className="h-3 w-3" />
                  </a>
                )}
                {profile.bdsm_test_screenshot && (
                  <img
                    src={profile.bdsm_test_screenshot}
                    alt="BDSM test results"
                    className="w-full rounded-lg border border-border max-h-48 object-contain bg-muted"
                    loading="lazy"
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feature Unlocks */}
        {tiers.length > 0 && (
          <Card className="animate-fade-in">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                🔓 Unlocked Features
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {tiers.flatMap((tier) =>
                  tier.features.map((f) => (
                    <div
                      key={f.key}
                      className={cn(
                        "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all",
                        f.isUnlocked
                          ? "bg-primary/5 border-primary/20 text-foreground"
                          : "bg-muted/50 border-muted text-muted-foreground"
                      )}
                    >
                      <span>{f.icon}</span>
                      <span className="truncate">{f.label}</span>
                      {f.isUnlocked ? (
                        <CheckCircle className="h-3 w-3 text-success shrink-0 ml-auto" />
                      ) : (
                        <Lock className="h-3 w-3 shrink-0 ml-auto" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Premium Upsell — free tier only */}
        {tier === "free" && (
          <Card className="animate-fade-in bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Go Premium</h3>
                  <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                    <li className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-primary" />See who likes you</li>
                    <li className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-primary" />Unlimited Super Likes</li>
                    <li className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-primary" />Priority Visibility</li>
                  </ul>
                  <Button size="sm" className="mt-3" onClick={() => navigate("/premium")}>
                    View Plans
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Boost */}
        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-accent" />
                  Profile Boost
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasActiveBoost
                    ? "Your profile is currently boosted! 🔥"
                    : hasFeature("profile_boost")
                      ? "1 free boost/month with VIP"
                      : "Get to the top of discovery — $2.99"}
                </p>
              </div>
              <Button
                size="sm"
                disabled={hasActiveBoost || boostLoading}
                onClick={handleBoostProfile}
              >
                {boostLoading ? "..." : hasActiveBoost ? "Active" : "Boost"}
              </Button>
            </div>
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
            className="w-full justify-start text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
            onClick={() => navigate("/resources")}
          >
            <BookOpen className="mr-2 h-5 w-5" />Recommended Resources
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
