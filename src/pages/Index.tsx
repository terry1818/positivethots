import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { BottomNav } from "@/components/BottomNav";
import { ProfileCard } from "@/components/ProfileCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, BookOpen, Sparkles, Filter, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Profile {
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
}

interface UserBadge {
  module_id: string;
  education_modules: {
    slug: string;
    title: string;
  };
}

interface MatchedProfile extends Profile {
  badges: { moduleSlug: string; title: string }[];
  compatibilityScore: number;
}

const Index = () => {
  const [matches, setMatches] = useState<MatchedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userBadgeCount, setUserBadgeCount] = useState(0);
  const [requiredBadgeCount, setRequiredBadgeCount] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoadMatches();
  }, []);

  const checkAuthAndLoadMatches = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if onboarding is completed
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", session.user.id)
      .single();

    if (!profile?.onboarding_completed) {
      navigate("/onboarding");
      return;
    }

    setCurrentUserId(session.user.id);
    await Promise.all([
      loadUserBadges(session.user.id),
      loadCuratedMatches(session.user.id)
    ]);
  };

  const loadUserBadges = async (userId: string) => {
    try {
      // Only check foundation (required) badges for discovery lock
      const [badgesResult, modulesResult] = await Promise.all([
        supabase
          .from("user_badges")
          .select("module_id, education_modules!inner(is_required)")
          .eq("user_id", userId),
        supabase
          .from("education_modules")
          .select("id")
          .eq("is_required", true)
      ]);

      if (badgesResult.error) throw badgesResult.error;
      if (modulesResult.error) throw modulesResult.error;

      // Count only required badge completions for discovery unlock
      const requiredBadgeIds = new Set(modulesResult.data?.map(m => m.id) || []);
      const earnedRequiredCount = (badgesResult.data || []).filter(
        b => requiredBadgeIds.has(b.module_id)
      ).length;

      setUserBadgeCount(earnedRequiredCount);
      setRequiredBadgeCount(modulesResult.data?.length || 5);
    } catch (error) {
      console.error("Error loading badges:", error);
    }
  };

  const loadCuratedMatches = async (userId: string) => {
    try {
      // Get current user's profile for matching
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      // Get profiles that user hasn't already connected with
      const { data: existingMatches } = await supabase
        .from("matches")
        .select("user1_id, user2_id")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      const excludeIds = new Set<string>([userId]);
      existingMatches?.forEach(m => {
        excludeIds.add(m.user1_id);
        excludeIds.add(m.user2_id);
      });

      // Fetch potential matches
      let query = supabase
        .from("profiles")
        .select("*")
        .eq("onboarding_completed", true);

      if (excludeIds.size > 0) {
        query = query.not("id", "in", `(${Array.from(excludeIds).join(",")})`);
      }

      const { data: profiles, error } = await query.limit(20);
      if (error) throw error;

      // Fetch badges for all these profiles
      const profileIds = profiles?.map(p => p.id) || [];
      const { data: allBadges } = await supabase
        .from("user_badges")
        .select(`
          user_id,
          module_id,
          education_modules (slug, title)
        `)
        .in("user_id", profileIds);

      // Map badges to profiles and calculate compatibility
      const matchedProfiles: MatchedProfile[] = (profiles || []).map(profile => {
        const profileBadges = (allBadges || [])
          .filter(b => b.user_id === profile.id)
          .map(b => ({
            moduleSlug: (b.education_modules as any)?.slug || '',
            title: (b.education_modules as any)?.title || ''
          }));

        // Calculate compatibility score
        const score = calculateCompatibility(currentProfile, profile, profileBadges.length);

        return {
          ...profile,
          badges: profileBadges,
          compatibilityScore: score
        };
      });

      // Sort by compatibility score (highest first)
      matchedProfiles.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      setMatches(matchedProfiles);
    } catch (error: any) {
      console.error("Error loading matches:", error);
      toast.error("Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  };

  const calculateCompatibility = (
    currentUser: any, 
    otherUser: any, 
    badgeCount: number
  ): number => {
    let score = 0;
    let factors = 0;

    // Badge completion (20 points max)
    score += Math.min(badgeCount * 4, 20);
    factors += 20;

    // Same looking_for (20 points)
    if (currentUser?.looking_for && otherUser?.looking_for) {
      if (currentUser.looking_for === otherUser.looking_for) {
        score += 20;
      }
      factors += 20;
    }

    // Same relationship style (20 points)
    if (currentUser?.relationship_style && otherUser?.relationship_style) {
      if (currentUser.relationship_style === otherUser.relationship_style) {
        score += 20;
      }
      factors += 20;
    }

    // Shared interests (20 points max)
    if (currentUser?.interests && otherUser?.interests) {
      const shared = currentUser.interests.filter((i: string) => 
        otherUser.interests.includes(i)
      ).length;
      score += Math.min(shared * 5, 20);
      factors += 20;
    }

    // Same location (10 points)
    if (currentUser?.location && otherUser?.location) {
      if (currentUser.location.toLowerCase() === otherUser.location.toLowerCase()) {
        score += 10;
      }
      factors += 10;
    }

    // Experience level proximity (10 points)
    const expLevels = ['curious', 'new', 'experienced', 'veteran'];
    if (currentUser?.experience_level && otherUser?.experience_level) {
      const diff = Math.abs(
        expLevels.indexOf(currentUser.experience_level) - 
        expLevels.indexOf(otherUser.experience_level)
      );
      score += Math.max(10 - diff * 3, 0);
      factors += 10;
    }

    return factors > 0 ? Math.round((score / factors) * 100) : 50;
  };

  const handleConnect = async (profileId: string) => {
    if (!currentUserId) return;

    try {
      // Record interest (like a swipe right)
      const { error: swipeError } = await supabase.from("swipes").insert({
        swiper_id: currentUserId,
        swiped_id: profileId,
        direction: "right",
      });

      if (swipeError) throw swipeError;

      // Check for match
      const { data: matchId } = await supabase.rpc("check_match", {
        user1: currentUserId,
        user2: profileId,
      });

      if (matchId) {
        toast.success("🎉 It's a match!", {
          description: "You can now message each other!"
        });
      } else {
        toast.success("Interest sent!");
      }

      // Remove from list
      setMatches(prev => prev.filter(p => p.id !== profileId));
    } catch (error: any) {
      console.error("Error connecting:", error);
      toast.error("Failed to send interest");
    }
  };

  const hasEnoughBadges = userBadgeCount >= requiredBadgeCount;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <Button variant="ghost" size="icon">
            <Filter className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-6">
        {!hasEnoughBadges ? (
          // Education gate
          <Card className="bg-gradient-to-br from-secondary/10 to-primary/10 border-0">
            <CardContent className="pt-6 text-center">
              <BookOpen className="h-16 w-16 mx-auto text-secondary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Complete Your Education</h2>
              <p className="text-muted-foreground mb-4">
                Finish all required learning modules to unlock full discovery features.
              </p>
              <Badge variant="outline" className="mb-4">
                {userBadgeCount}/{requiredBadgeCount} badges earned
              </Badge>
              <div className="mt-4">
                <Button onClick={() => navigate("/learn")}>
                  Continue Learning
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : matches.length > 0 ? (
          <>
            {/* Daily Suggestions Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Curated For You
                </h2>
                <p className="text-sm text-muted-foreground">
                  Based on compatibility, not popularity
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setLoading(true);
                  currentUserId && loadCuratedMatches(currentUserId);
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Profile Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {matches.map((profile) => (
                <div key={profile.id} className="relative">
                  <ProfileCard
                    profile={profile}
                    badges={profile.badges}
                    compatibilityScore={profile.compatibilityScore}
                    onClick={() => navigate(`/user/${profile.id}`)}
                  />
                  <div className="absolute bottom-4 right-4">
                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnect(profile.id);
                      }}
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      Connect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center px-8 py-12">
            <div className="animate-fade-in">
              <Heart className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
              <h2 className="text-3xl font-bold mb-3">No New Suggestions</h2>
              <p className="text-muted-foreground text-lg mb-6">
                Check back later for more compatible connections
              </p>
              <Button onClick={() => navigate("/learn")}>
                Continue Learning
              </Button>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;