import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, BookOpen, Shield, Eye, EyeOff, Star, Zap, Users, Lock, Copy } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { MatchModal } from "@/components/MatchModal";
import { MicroCelebration } from "@/components/onboarding/MicroCelebration";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { NearbyUsers } from "@/components/NearbyUsers";
import { DiscoveryCard } from "@/components/discovery/DiscoveryCard";
import { SwipeDiscoveryCard } from "@/components/discovery/SwipeDiscoveryCard";
import { ProfileDetailSheet } from "@/components/discovery/ProfileDetailSheet";
import { CompactProgressBar } from "@/components/discovery/CompactProgressBar";
import { useLocationSharing } from "@/hooks/useLocationSharing";
import { useSuperLikes } from "@/hooks/useSuperLikes";
import { useFeatureUnlocks } from "@/hooks/useFeatureUnlocks";
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
  compatibility_reasons?: string[];
  last_active?: string;
  verified?: boolean;
  distance?: number | null;
  is_boosted?: boolean;
}

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

const calculateCompatibilityReasons = (
  user: Profile, other: DiscoveryProfile, otherBadges: number, userBadges: number, isSharing: boolean
): string[] => {
  const reasons: string[] = [];
  const userInterests = new Set(user.interests || []);
  const otherInterests = new Set(other.interests || []);
  const sharedInterests = [...userInterests].filter(i => otherInterests.has(i));
  if (sharedInterests.length >= 2) {
    reasons.push(`You share ${sharedInterests.length} interests including ${sharedInterests.slice(0, 2).join(" and ")}`);
  }
  if (user.relationship_style && user.relationship_style === other.relationship_style) {
    const styleName = user.relationship_style.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    reasons.push(`You're both into ${styleName}`);
  }
  const experienceLevels = ["curious", "new", "experienced", "veteran"];
  const userExp = experienceLevels.indexOf(user.experience_level || "new");
  const otherExp = experienceLevels.indexOf(other.experience_level || "new");
  if (Math.abs(userExp - otherExp) <= 1) {
    reasons.push("Similar relationship experience level");
  }
  if (isSharing && user.location && other.location && user.location === other.location) {
    reasons.push(`Both near ${user.location}`);
  }
  const badgeDiff = Math.abs(userBadges - otherBadges);
  if (badgeDiff <= 2 && userBadges > 0 && otherBadges > 0) {
    reasons.push("Both completed similar education modules");
  }
  return reasons.slice(0, 3);
};

const Index = () => {
  const { isSharing, nearbyUsers } = useLocationSharing();
  const { balance: superLikeBalance, canSuperLike, sendSuperLike, isUnlimited } = useSuperLikes();
  const { tiers, loading: tiersLoading } = useFeatureUnlocks();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [suggestions, setSuggestions] = useState<EnhancedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchedUser, setMatchedUser] = useState<EnhancedProfile | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [incognitoMode, setIncognitoMode] = useState(false);
  const [userBadgeCount, setUserBadgeCount] = useState(0);
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewProfiles, setPreviewProfiles] = useState<EnhancedProfile[]>([]);
  const [requiredCount, setRequiredCount] = useState(5);
  const [detailProfile, setDetailProfile] = useState<EnhancedProfile | null>(null);
  const [matchCount, setMatchCount] = useState(0);

  // Handle super like purchase redirect
  useEffect(() => {
    if (searchParams.get("superlikes") === "purchased") {
      toast.success("Thots purchased! 💜", { description: "10 Thots added to your balance." });
    }
  }, [searchParams]);

  useEffect(() => {
    checkAuthAndSetup();
  }, []);

  const checkAuthAndSetup = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }

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
    setRequiredCount(requiredFoundationCount);

    if (badgeCount < requiredFoundationCount) {
      // Show blurred preview instead of redirecting
      setPreviewMode(true);
      trackEvent('discovery_preview_shown', { badge_count: badgeCount });

      // Load preview profiles
      const { data: previewData } = await supabase.rpc("get_discovery_profiles", { _exclude_ids: [session.user.id] });
      if (previewData) {
        const enhanced: EnhancedProfile[] = previewData.slice(0, 6).map(p => ({
          ...p,
          compatibility_score: null,
          compatibility_reasons: [],
          verified: false,
          distance: null,
          is_boosted: false,
        }));
        setPreviewProfiles(enhanced);
      }
      setLoading(false);
      return;
    }

    await loadSuggestions(session.user.id, profile);
    setLoading(false);
  };

  const loadSuggestions = async (userId: string, profile: Profile) => {
    const [matchesResult, blockedResult, swipesResult] = await Promise.all([
      supabase.from("matches").select("user1_id, user2_id")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
      supabase.from("blocked_users").select("blocked_id, blocker_id")
        .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
      supabase.from("swipes").select("swiped_id").eq("swiper_id", userId),
    ]);

    const matchedUserIds = new Set(matchesResult.data?.flatMap(m => [m.user1_id, m.user2_id]) || []);
    setMatchCount(matchesResult.data?.length || 0);
    matchedUserIds.add(userId);

    const blockedUserIds = new Set<string>();
    blockedResult.data?.forEach(row => {
      if (row.blocker_id === userId) blockedUserIds.add(row.blocked_id);
      else blockedUserIds.add(row.blocker_id);
    });

    const swipedUserIds = new Set(swipesResult.data?.map(s => s.swiped_id) || []);

    const excludeIds = [userId, ...Array.from(matchedUserIds), ...Array.from(blockedUserIds), ...Array.from(swipedUserIds)];

    const [profilesResult, allBadgesResult, boostsResult] = await Promise.all([
      supabase.rpc("get_discovery_profiles", { _exclude_ids: excludeIds }),
      supabase.from("user_badges").select("user_id, module_id"),
      supabase.from("profile_boosts").select("user_id").gt("expires_at", new Date().toISOString()),
    ]);

    if (!profilesResult.data) return;

    const badgeCounts = new Map<string, number>();
    allBadgesResult.data?.forEach(badge => {
      badgeCounts.set(badge.user_id, (badgeCounts.get(badge.user_id) || 0) + 1);
    });

    const boostedUserIds = new Set(boostsResult.data?.map(b => b.user_id) || []);

    const enhancedProfiles: EnhancedProfile[] = profilesResult.data
      .map(p => ({
        ...p,
        badge_count: badgeCounts.get(p.id) || 0,
        compatibility_score: calculateCompatibility(profile, p, badgeCounts.get(p.id) || 0, badgeCounts.get(userId) || 0),
        compatibility_reasons: calculateCompatibilityReasons(profile, p, badgeCounts.get(p.id) || 0, badgeCounts.get(userId) || 0, isSharing),
        verified: (badgeCounts.get(p.id) || 0) >= 3,
        distance: null,
        is_boosted: boostedUserIds.has(p.id),
      }))
      .sort((a, b) => {
        if (a.is_boosted && !b.is_boosted) return -1;
        if (!a.is_boosted && b.is_boosted) return 1;
        return (b.compatibility_score || 0) - (a.compatibility_score || 0);
      })
      .slice(0, 12);

    setSuggestions(enhancedProfiles);
  };

  const handleConnect = useCallback(async (otherUserId: string) => {
    if (!currentUser) return;
    const { error: swipeError } = await supabase.from("swipes").insert({
      swiper_id: currentUser.id, swiped_id: otherUserId, direction: "right",
    });
    if (swipeError) { toast.error("Failed to send connection"); console.error("Swipe error:", swipeError); return; }

    trackEvent("swipe", { direction: "right", swiped_id: otherUserId });
    setCelebrationTrigger(prev => prev + 1);

    const { data: matchData, error: matchError } = await supabase
      .rpc("check_match", { user1: currentUser.id, user2: otherUserId });
    if (matchError) { console.error("Match check error:", matchError); return; }

    if (matchData) {
      trackEvent("match", { matched_user_id: otherUserId });
      const matchedProfile = suggestions.find(s => s.id === otherUserId);
      if (matchedProfile) { setMatchedUser(matchedProfile); setShowMatchModal(true); }
      toast.success("You Both Said Yes 💜", { description: "You can now start chatting!" });
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

  const handleSuperLike = useCallback(async (otherUserId: string) => {
    if (!currentUser) return;
    const success = await sendSuperLike(otherUserId);
    if (!success) {
      toast.error("No Thots left", { description: "Purchase more or wait until tomorrow." });
      return;
    }

    trackEvent("super_like", { swiped_id: otherUserId });
    setCelebrationTrigger(prev => prev + 1);

    const { data: matchData } = await supabase
      .rpc("check_match", { user1: currentUser.id, user2: otherUserId });

    if (matchData) {
      trackEvent("match", { matched_user_id: otherUserId });
      const matchedProfile = suggestions.find(s => s.id === otherUserId);
      if (matchedProfile) { setMatchedUser(matchedProfile); setShowMatchModal(true); }
      toast.success("It's a Match! 💕", { description: "Your Super Like worked!" });
    } else {
      toast.success("Super Like Sent! ⭐", { description: "They'll see you stand out!" });
    }
    setSuggestions(prev => prev.filter(s => s.id !== otherUserId));
  }, [currentUser, suggestions, sendSuperLike]);

  const handleBoostClick = async () => {
    trackEvent('discovery_empty_boost_clicked', {});
    try {
      const { data, error } = await supabase.functions.invoke("create-boost-payment");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      toast.error("Failed to start boost checkout");
    }
  };

  const handleReferralClick = async () => {
    trackEvent('discovery_empty_referral_clicked', {});
    if (!currentUser) return;
    try {
      const { data: existingCodes } = await supabase
        .from("promo_codes")
        .select("code")
        .eq("created_by", currentUser.id)
        .eq("type", "referral")
        .is("redeemed_by", null)
        .limit(1);

      let code = existingCodes?.[0]?.code;
      if (!code) {
        code = Array.from({ length: 8 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]).join("");
        await supabase.from("promo_codes").insert({
          code,
          type: "referral",
          created_by: currentUser.id,
          trial_days: 14,
          tier: "premium",
        });
      }
      const link = `https://positivethots.lovable.app/auth?ref=${code}`;
      await navigator.clipboard.writeText(link);
      toast.success("Referral link copied!", { description: "Share it with friends to earn rewards." });
    } catch (err) {
      toast.error("Failed to generate referral link");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <Logo size="md" showText={false} />
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

  // Discovery Preview Mode (badge gate)
  if (previewMode) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <Logo size="md" showText={false} />
          </div>
        </div>

        <div className="container max-w-7xl mx-auto px-4 py-4 relative">
          {/* Blurred profile grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 filter blur-[8px] pointer-events-none select-none" aria-hidden="true">
            {previewProfiles.map((profile, idx) => (
              <DiscoveryCard
                key={profile.id}
                profile={profile}
                index={idx}
                onConnect={() => {}}
                onPass={() => {}}
              />
            ))}
          </div>

          {/* Overlay card */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <Card className="max-w-sm w-full p-8 text-center shadow-xl bg-card/95 backdrop-blur-sm border-primary/20">
              <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Unlock Discovery</h2>
              <p className="text-muted-foreground mb-6">
                Complete {requiredCount - userBadgeCount} Foundation module{requiredCount - userBadgeCount !== 1 ? "s" : ""} to see who's here
              </p>
              <div className="mb-6">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>{userBadgeCount} of {requiredCount} complete</span>
                  <span>{Math.round((userBadgeCount / requiredCount) * 100)}%</span>
                </div>
                <Progress value={(userBadgeCount / requiredCount) * 100} className="h-3" />
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  trackEvent('discovery_preview_cta_clicked', {});
                  navigate('/learn');
                }}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Start Learning →
              </Button>
            </Card>
          </div>
        </div>

        <BottomNav />
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
            <Logo size="md" showText={false} />
            <div className="flex items-center gap-2">
              {canSuperLike && (
                <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  {isUnlimited ? "∞" : superLikeBalance}
                </Badge>
              )}
              <Button
                variant={incognitoMode ? "default" : "outline"} size="sm"
                onClick={() => setIncognitoMode(!incognitoMode)}
              >
                {incognitoMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">{incognitoMode ? "Incognito" : "Visible"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                onClick={async () => {
                  try {
                    const { data, error } = await supabase.functions.invoke("create-boost-payment");
                    if (error) throw error;
                    if (data?.url) window.open(data.url, "_blank");
                  } catch (err) {
                    toast.error("Failed to start boost checkout");
                  }
                }}
              >
                <Zap className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Boost</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
                <Shield className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Settings</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Progress Strip */}
      {tiers.length > 0 && (
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <CompactProgressBar tiers={tiers} badgeCount={userBadgeCount} suggestionCount={suggestions.length} />
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
          <div className="space-y-4">
            {/* Boost upsell card */}
            <Card className="p-6 text-center">
              <Zap className="h-12 w-12 text-amber-500 mx-auto mb-3" />
              <h2 className="text-xl font-bold mb-1">Get Seen by More People</h2>
              <p className="text-muted-foreground text-sm mb-1">
                A Profile Boost puts you at the top of Discovery for 24 hours.
              </p>
              <p className="text-sm font-semibold text-primary mb-4">$2.99</p>
              <Button className="w-full max-w-xs mx-auto" onClick={handleBoostClick}>
                <Zap className="h-4 w-4 mr-2" />
                Boost Now
              </Button>
            </Card>

            {/* Referral card */}
            <Card className="p-6 text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-bold mb-1">Invite a Friend, Earn a Free Boost</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Share your referral link and you both get rewarded.
              </p>
              <Button variant="outline" className="w-full max-w-xs mx-auto" onClick={handleReferralClick}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Referral Link
              </Button>
            </Card>

            <p className="text-center text-xs text-muted-foreground">
              New profiles added daily — check back tomorrow
            </p>
          </div>
        ) : (
          <div className="relative flex justify-center items-start px-4 pt-2 pb-32" style={{ minHeight: '520px' }}>
            {suggestions.slice(0, 3).map((profile, stackIdx) => (
              <SwipeDiscoveryCard
                key={profile.id}
                profile={profile}
                isTop={stackIdx === 0}
                stackIndex={stackIdx}
                onConnect={handleConnect}
                onPass={handlePass}
                onSuperLike={handleSuperLike}
                canSuperLike={canSuperLike}
                superLikeBalance={isUnlimited ? 999 : superLikeBalance}
                onViewProfile={() => setDetailProfile(profile)}
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

      <ProfileDetailSheet
        profile={detailProfile}
        onClose={() => setDetailProfile(null)}
        onConnect={(id) => { handleConnect(id); setDetailProfile(null); }}
        onPass={(id) => { handlePass(id); setDetailProfile(null); }}
        onSuperLike={handleSuperLike}
        canSuperLike={canSuperLike}
      />

      <BottomNav />
    </div>
  );
};

export default Index;
