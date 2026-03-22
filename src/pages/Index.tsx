import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, BookOpen, Shield, Eye, EyeOff } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { MatchModal } from "@/components/MatchModal";
import { MicroCelebration } from "@/components/onboarding/MicroCelebration";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { NearbyUsers } from "@/components/NearbyUsers";
import { DiscoveryCard } from "@/components/discovery/DiscoveryCard";
import { useLocationSharing } from "@/hooks/useLocationSharing";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];

interface DiscoveryProfile {
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
}

interface EnhancedProfile extends DiscoveryProfile {
  badge_count?: number;
  compatibility_score?: number;
  last_active?: string;
  verified?: boolean;
  distance?: number;
}

const LAST_ACTIVE_OPTIONS = ["Just now", "5 min ago", "30 min ago", "1 hour ago", "2 hours ago", "Today"];

const calculateCompatibility = (user: Profile, other: DiscoveryProfile, otherBadges: number, userBadges: number): number => {
  let score = 0;
  const userInterests = new Set(user.interests || []);
  const otherInterests = new Set(other.interests || []);
  const sharedInterests = [...userInterests].filter(i => otherInterests.has(i));
  score += Math.min(20, sharedInterests.length * 4);
  if (user.relationship_style === other.relationship_style) score += 20;
  else if (
    (user.relationship_style === "polyamory" && other.relationship_style === "open") ||
    (user.relationship_style === "open" && other.relationship_style === "polyamory")
  ) score += 10;
  const userLookingFor = new Set((user.looking_for || "").split(",").map(s => s.trim()));
  const otherLookingFor = new Set((other.looking_for || "").split(",").map(s => s.trim()));
  const sharedGoals = [...userLookingFor].filter(g => otherLookingFor.has(g));
  score += Math.min(20, sharedGoals.length * 10);
  const badgeDiff = Math.abs(userBadges - otherBadges);
  if (badgeDiff === 0) score += 20;
  else if (badgeDiff <= 2) score += 15;
  else if (badgeDiff <= 5) score += 10;
  else score += 5;
  if (user.location === other.location && user.location) score += 10;
  const experienceLevels = ["curious", "new", "experienced", "veteran"];
  const userExp = experienceLevels.indexOf(user.experience_level || "new");
  const otherExp = experienceLevels.indexOf(other.experience_level || "new");
  score += Math.max(0, 10 - Math.abs(userExp - otherExp) * 3);
  return Math.min(100, Math.max(0, score));
};

const Index = () => {
  const { isSharing, nearbyUsers } = useLocationSharing();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [suggestions, setSuggestions] = useState<EnhancedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchedUser, setMatchedUser] = useState<EnhancedProfile | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [incognitoMode, setIncognitoMode] = useState(false);
  const [userBadgeCount, setUserBadgeCount] = useState(0);
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);

  useEffect(() => {
    checkAuthAndSetup();
  }, []);

  const checkAuthAndSetup = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }

    // Parallel: profile + badges + foundation modules
    const [profileResult, badgesResult, foundationResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", session.user.id).single(),
      supabase.from("user_badges").select("module_id").eq("user_id", session.user.id),
      supabase.from("education_modules").select("id").eq("tier", "foundation").eq("is_required", true),
    ]);

    const profile = profileResult.data;
    if (!profile) { navigate("/auth"); return; }
    if (!profile.onboarding_completed) { navigate("/onboarding"); return; }

    setCurrentUser(profile);

    const badgeCount = badgesResult.data?.length || 0;
    setUserBadgeCount(badgeCount);
    const requiredFoundationCount = foundationResult.data?.length || 5;

    if (badgeCount < requiredFoundationCount) {
      toast.error("Complete Foundation Education", {
        description: `You need to earn ${requiredFoundationCount - badgeCount} more foundation badges to access Discovery.`,
      });
      navigate("/learn");
      return;
    }

    await loadSuggestions(session.user.id, profile);
    setLoading(false);
  };

  const loadSuggestions = async (userId: string, profile: Profile) => {
    // Parallel: matches + blocked users
    const [matchesResult, blockedResult] = await Promise.all([
      supabase.from("matches").select("user1_id, user2_id")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
      supabase.from("blocked_users").select("blocked_id, blocker_id")
        .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
    ]);

    const matchedUserIds = new Set(matchesResult.data?.flatMap(m => [m.user1_id, m.user2_id]) || []);
    matchedUserIds.add(userId);

    const blockedUserIds = new Set<string>();
    blockedResult.data?.forEach(row => {
      if (row.blocker_id === userId) blockedUserIds.add(row.blocked_id);
      else blockedUserIds.add(row.blocker_id);
    });

    const excludeIds = [userId, ...Array.from(matchedUserIds), ...Array.from(blockedUserIds)];

    // Parallel: discovery profiles + all badges for scoring
    const [profilesResult, allBadgesResult] = await Promise.all([
      supabase.rpc("get_discovery_profiles", { _exclude_ids: excludeIds }),
      supabase.from("user_badges").select("user_id, module_id"),
    ]);

    if (!profilesResult.data) return;

    const badgeCounts = new Map<string, number>();
    allBadgesResult.data?.forEach(badge => {
      badgeCounts.set(badge.user_id, (badgeCounts.get(badge.user_id) || 0) + 1);
    });

    const enhancedProfiles: EnhancedProfile[] = profilesResult.data
      .map(p => ({
        ...p,
        badge_count: badgeCounts.get(p.id) || 0,
        compatibility_score: calculateCompatibility(profile, p, badgeCounts.get(p.id) || 0, badgeCounts.get(userId) || 0),
        last_active: LAST_ACTIVE_OPTIONS[Math.floor(Math.random() * LAST_ACTIVE_OPTIONS.length)],
        verified: (badgeCounts.get(p.id) || 0) >= 3,
        distance: Math.floor(Math.random() * 20) + 1,
      }))
      .sort((a, b) => (b.compatibility_score || 0) - (a.compatibility_score || 0))
      .slice(0, 12);

    setSuggestions(enhancedProfiles);
  };

  const handleConnect = useCallback(async (otherUserId: string) => {
    if (!currentUser) return;
    const { error: swipeError } = await supabase.from("swipes").insert({
      swiper_id: currentUser.id, swiped_id: otherUserId, direction: "right",
    });
    if (swipeError) { console.error("Swipe error:", swipeError); return; }

    trackEvent("swipe", { direction: "right", swiped_id: otherUserId });
    setCelebrationTrigger(prev => prev + 1);

    const { data: matchData, error: matchError } = await supabase
      .rpc("check_match", { user1: currentUser.id, user2: otherUserId });
    if (matchError) { console.error("Match check error:", matchError); return; }

    if (matchData) {
      trackEvent("match", { matched_user_id: otherUserId });
      const matchedProfile = suggestions.find(s => s.id === otherUserId);
      if (matchedProfile) { setMatchedUser(matchedProfile); setShowMatchModal(true); }
      toast.success("It's a Match! 💕", { description: "You can now start chatting!" });
    } else {
      toast.success("Connection Sent", { description: "They'll be notified of your interest!" });
    }
    setSuggestions(prev => prev.filter(s => s.id !== otherUserId));
  }, [currentUser, suggestions]);

  const handlePass = useCallback(async (otherUserId: string) => {
    if (!currentUser) return;
    await supabase.from("swipes").insert({
      swiper_id: currentUser.id, swiped_id: otherUserId, direction: "left",
    });
    trackEvent("swipe", { direction: "left", swiped_id: otherUserId });
    setSuggestions(prev => prev.filter(s => s.id !== otherUserId));
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <Logo size="md" />
          </div>
        </div>
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <Skeleton key={i} className="h-96 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <MicroCelebration trigger={celebrationTrigger} emojis={["💕", "✨", "💜", "🔥"]} />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-2">
              <Button
                variant={incognitoMode ? "default" : "outline"} size="sm"
                onClick={() => setIncognitoMode(!incognitoMode)}
              >
                {incognitoMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">{incognitoMode ? "Incognito" : "Visible"}</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
                <Shield className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Settings</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="container max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center animate-stagger-fade" style={{ animationDelay: "0ms" }}>
            <div className="text-2xl font-bold text-primary">
              <AnimatedCounter end={suggestions.length} />
            </div>
            <div className="text-sm text-muted-foreground">New Matches</div>
          </Card>
          <Card className="p-4 text-center animate-stagger-fade" style={{ animationDelay: "100ms" }}>
            <div className="text-2xl font-bold text-secondary">
              <AnimatedCounter end={userBadgeCount} />
            </div>
            <div className="text-sm text-muted-foreground">Badges Earned</div>
          </Card>
          <Card className="p-4 text-center animate-stagger-fade" style={{ animationDelay: "200ms" }}>
            <div className="text-2xl font-bold text-accent">Active</div>
            <div className="text-sm text-muted-foreground">Status</div>
          </Card>
        </div>
      </div>

      {/* Education Reminder */}
      {userBadgeCount < 10 && (
        <div className="container max-w-7xl mx-auto px-4 mb-4">
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Boost Your Matches</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete more education modules to unlock better compatibility scoring and increase your match potential!
                </p>
              </div>
              <Button size="sm" onClick={() => navigate("/learn")}>Learn</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Nearby Users */}
      {isSharing && (
        <div className="container max-w-7xl mx-auto px-4 mb-4">
          <NearbyUsers nearbyUsers={nearbyUsers} isSharing={isSharing} />
        </div>
      )}

      {/* Curated Matches Grid */}
      <div className="container max-w-7xl mx-auto px-4">
        {suggestions.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="animate-bounce-in">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No More Suggestions</h2>
            <p className="text-muted-foreground mb-6">Check back later for new matches!</p>
            <Button onClick={() => navigate("/learn")}>
              <BookOpen className="h-4 w-4 mr-2" />
              Continue Learning
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((profile, idx) => (
              <DiscoveryCard
                key={profile.id}
                profile={profile}
                index={idx}
                onConnect={handleConnect}
                onPass={handlePass}
              />
            ))}
          </div>
        )}
      </div>

      {matchedUser && (
        <MatchModal
          isOpen={showMatchModal}
          onClose={() => setShowMatchModal(false)}
          matchedUser={matchedUser}
          onSendMessage={() => { setShowMatchModal(false); navigate("/messages"); }}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default Index;
