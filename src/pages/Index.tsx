import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, BookOpen, Shield, Eye, EyeOff, Star, Zap, Users, Copy, Sparkles, MapPin, Share2, Undo2, RefreshCw } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BrandedEmptyState } from "@/components/BrandedEmptyState";
import { calculateCompatibilityBreakdown, type CompatibilityBreakdownResult } from "@/lib/compatibility";
import { CompatibilityBreakdown } from "@/components/discovery/CompatibilityBreakdown";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { MysteryMatchCard } from "@/components/discovery/MysteryMatchCard";
import { DiscoveryWalkthrough, shouldShowWalkthrough } from "@/components/discovery/DiscoveryWalkthrough";
import { SwipeTutorial, shouldShowSwipeTutorial } from "@/components/discovery/SwipeTutorial";
import { useLocationSharing } from "@/hooks/useLocationSharing";
import { useSuperLikes } from "@/hooks/useSuperLikes";
import { useFeatureUnlocks } from "@/hooks/useFeatureUnlocks";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useSubscription } from "@/hooks/useSubscription";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSkeleton } from "@/components/PageSkeleton";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { useReducedMotion } from "@/hooks/useReducedMotion";

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
  is_recycled?: boolean;
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

const MYSTERY_INTERVAL = 10; // Insert mystery card every N cards

const getMysteryRevealLimit = (tier: string): number => {
  if (tier === "vip" || tier === "premium") return 999;
  if (tier === "plus") return 3;
  return 1;
};

const Index = () => {
  const { isSharing, nearbyUsers } = useLocationSharing();
  const { balance: superLikeBalance, canSuperLike, sendSuperLike, isUnlimited } = useSuperLikes();
  const { tiers, loading: tiersLoading } = useFeatureUnlocks();
  const { playMatch, playThot, playButtonTap } = useSoundEffects();
  const { tier: subTier } = useSubscription();
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
  const [mysteryRevealsUsed, setMysteryRevealsUsed] = useState(0);
  const [mysteryProfiles, setMysteryProfiles] = useState<Set<string>>(new Set());
  const [matchBreakdown, setMatchBreakdown] = useState<CompatibilityBreakdownResult | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdownName, setBreakdownName] = useState("");
  const [announcedProfile, setAnnouncedProfile] = useState("");
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showSwipeTutorial, setShowSwipeTutorial] = useState(false);
  const [showWalkthroughPending, setShowWalkthroughPending] = useState(false);
  const [lastPassedProfile, setLastPassedProfile] = useState<EnhancedProfile | null>(null);
  const [showUndoButton, setShowUndoButton] = useState(false);
  const [dailyUndoCount, setDailyUndoCount] = useState(0);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const prefersReducedMotion = useReducedMotion();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resettingFeed, setResettingFeed] = useState(false);

  // Handle super like purchase redirect
  useEffect(() => {
    if (searchParams.get("superlikes") === "purchased") {
      toast.success("Thots purchased! 💜", { description: "10 Thots added to your balance." });
    }
  }, [searchParams]);

  // Deferred walkthrough check: only show if suggestions are loaded
  useEffect(() => {
    if (!showWalkthroughPending || loading) return;
    setShowWalkthroughPending(false);
    if (suggestions.length > 0 && shouldShowWalkthrough()) {
      setTimeout(() => setShowWalkthrough(true), 500);
    } else if (suggestions.length > 0 && shouldShowSwipeTutorial()) {
      setTimeout(() => setShowSwipeTutorial(true), 500);
    }
  }, [showWalkthroughPending, loading, suggestions.length]);

  // Dismiss walkthrough if suggestions become empty
  useEffect(() => {
    if (showWalkthrough && suggestions.length === 0) {
      setShowWalkthrough(false);
    }
    if (showSwipeTutorial && suggestions.length === 0) {
      setShowSwipeTutorial(false);
    }
  }, [suggestions.length, showWalkthrough, showSwipeTutorial]);

  useEffect(() => {
    checkAuthAndSetup();
  }, []);
  const handleResetFeed = useCallback(async () => {
    const lastReset = localStorage.getItem("pt_last_feed_reset");
    if (lastReset) {
      const daysSince = Math.floor((Date.now() - parseInt(lastReset)) / (1000 * 60 * 60 * 24));
      if (daysSince < 7) {
        toast(`You can reset again in ${7 - daysSince} day${7 - daysSince === 1 ? '' : 's'}`);
        setShowResetDialog(false);
        return;
      }
    }
    setResettingFeed(true);
    const { data, error } = await supabase.rpc("reset_discovery_feed");
    setResettingFeed(false);
    setShowResetDialog(false);
    if (error) { toast.error("Failed to reset feed"); return; }
    const result = data as { reset_count: number; message: string } | null;
    localStorage.setItem("pt_last_feed_reset", Date.now().toString());
    toast.success(`Feed reset! ${result?.reset_count ?? 0} profiles will reappear. 🔄`);
    if (currentUser) await loadSuggestions(currentUser.id, currentUser);
  }, [currentUser]);


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

    // No longer gate Discovery behind Foundation badges — allow full browsing
    await loadSuggestions(session.user.id, profile);
    setLoading(false);

    // Sync tutorial flags from DB → localStorage
    const tutorialsCompleted: string[] = (profile as any).tutorials_completed || [];
    if (tutorialsCompleted.includes("discovery_walkthrough") && !localStorage.getItem("pt_discovery_walkthrough_seen")) {
      localStorage.setItem("pt_discovery_walkthrough_seen", "true");
    }
    if (tutorialsCompleted.includes("swipe_tutorial") && !localStorage.getItem("pt_swipe_tutorial_seen")) {
      localStorage.setItem("pt_swipe_tutorial_seen", "true");
    }

    // Show walkthrough for first-time users — only if profiles exist
    // (suggestions set after loadSuggestions, so we defer check)
    setShowWalkthroughPending(true);
  };

  const loadSuggestions = async (userId: string, profile: Profile) => {
    const [matchesResult, blockedResult] = await Promise.all([
      supabase.from("matches").select("user1_id, user2_id")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
      supabase.from("blocked_users").select("blocked_id, blocker_id")
        .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
    ]);

    const matchedUserIds = new Set(matchesResult.data?.flatMap(m => [m.user1_id, m.user2_id]) || []);
    setMatchCount(matchesResult.data?.length || 0);
    matchedUserIds.add(userId);

    const blockedUserIds = new Set<string>();
    blockedResult.data?.forEach(row => {
      if (row.blocker_id === userId) blockedUserIds.add(row.blocked_id);
      else blockedUserIds.add(row.blocker_id);
    });

    // Only pass matched + blocked IDs; the RPC handles left-swipe recycling server-side
    const excludeIds = [userId, ...Array.from(matchedUserIds), ...Array.from(blockedUserIds)];

    const [profilesResult, allBadgesResult, boostsResult] = await Promise.all([
      supabase.rpc("get_discovery_profiles", { _exclude_ids: excludeIds }),
      supabase.from("user_badges").select("user_id, module_id"),
      supabase.from("profile_boosts").select("user_id").gt("expires_at", new Date().toISOString()),
    ]);

    if (!profilesResult.data) return;

    // Enrich with actual approved photos from user_photos table
    const profileIds = profilesResult.data.map(p => p.id);
    const { data: userPhotos } = await supabase
      .from("user_photos")
      .select("user_id, photo_url, order_index")
      .in("user_id", profileIds)
      .eq("visibility", "public")
      .eq("moderation_status", "approved")
      .order("order_index", { ascending: true });

    const photosByUser = new Map<string, string[]>();
    userPhotos?.forEach(photo => {
      const existing = photosByUser.get(photo.user_id) || [];
      existing.push(photo.photo_url);
      photosByUser.set(photo.user_id, existing);
    });

    const badgeCounts = new Map<string, number>();
    allBadgesResult.data?.forEach(badge => {
      badgeCounts.set(badge.user_id, (badgeCounts.get(badge.user_id) || 0) + 1);
    });

    const boostedUserIds = new Set(boostsResult.data?.map(b => b.user_id) || []);

    const enhancedProfiles: EnhancedProfile[] = profilesResult.data
      .map(p => ({
        ...p,
        profile_image: photosByUser.get(p.id)?.[0] || p.profile_image || null,
        photos: photosByUser.get(p.id)?.slice(1) || p.photos || null,
        badge_count: badgeCounts.get(p.id) || 0,
        compatibility_score: calculateCompatibility(profile, p, badgeCounts.get(p.id) || 0, badgeCounts.get(userId) || 0),
        compatibility_reasons: calculateCompatibilityReasons(profile, p, badgeCounts.get(p.id) || 0, badgeCounts.get(userId) || 0, isSharing),
        verified: p.is_verified,
        distance: null,
        is_boosted: boostedUserIds.has(p.id),
      }))
      .sort((a, b) => {
        if (a.is_boosted && !b.is_boosted) return -1;
        if (!a.is_boosted && b.is_boosted) return 1;
        // Trust boost: verified +5, badges give up to +5 bonus
        const trustA = (a.verified ? 5 : 0) + Math.min(5, (a.badge_count || 0));
        const trustB = (b.verified ? 5 : 0) + Math.min(5, (b.badge_count || 0));
        return ((b.compatibility_score || 0) + trustB) - ((a.compatibility_score || 0) + trustA);
      })
      .slice(0, 20); // fetch more to have mystery candidates

    // Pick high-compatibility profiles as mystery matches (every MYSTERY_INTERVAL-th)
    const mysteryIds = new Set<string>();
    const highCompat = enhancedProfiles.filter(p => (p.compatibility_score || 0) >= 75);
    // Mark every 10th card position as mystery, using high-compat profiles
    let mysteryPool = [...highCompat];
    for (let i = MYSTERY_INTERVAL - 1; i < enhancedProfiles.length && mysteryPool.length > 0; i += MYSTERY_INTERVAL) {
      const candidate = mysteryPool.shift();
      if (candidate) {
        mysteryIds.add(candidate.id);
        // Move this profile to position i if it's not already there
        const currentIdx = enhancedProfiles.findIndex(p => p.id === candidate.id);
        if (currentIdx !== i && currentIdx !== -1) {
          enhancedProfiles.splice(currentIdx, 1);
          enhancedProfiles.splice(i, 0, candidate);
        }
      }
    }
    setMysteryProfiles(mysteryIds);

    // Load today's reveal count
    const { data: revealData } = await supabase
      .from("profiles")
      .select("mystery_reveals_today, mystery_reveals_date")
      .eq("id", userId)
      .single();
    if (revealData) {
      const today = new Date().toISOString().split("T")[0];
      setMysteryRevealsUsed(
        (revealData as any).mystery_reveals_date === today ? (revealData as any).mystery_reveals_today : 0
      );
    }

    setSuggestions(enhancedProfiles.slice(0, 15));
  };

  const mysteryRevealLimit = getMysteryRevealLimit(subTier);
  const canRevealMystery = mysteryRevealsUsed < mysteryRevealLimit;

  const handleMysteryReveal = useCallback(async (): Promise<boolean> => {
    if (!currentUser || !canRevealMystery) return false;
    const today = new Date().toISOString().split("T")[0];
    const newCount = mysteryRevealsUsed + 1;
    await supabase.from("profiles").update({
      mystery_reveals_today: newCount,
      mystery_reveals_date: today,
    } as any).eq("id", currentUser.id);
    setMysteryRevealsUsed(newCount);
    trackEvent("mystery_match_reveal", {});
    return true;
  }, [currentUser, canRevealMystery, mysteryRevealsUsed]);

  const handleMysteryUpgrade = useCallback(() => {
    toast("Want to reveal more Mystery Matches?", {
      description: "Upgrade to Plus for 3 daily reveals! 💜",
      action: { label: "Upgrade", onClick: () => navigate("/premium") },
      duration: 5000,
    });
  }, [navigate]);

  // Optimistic card removal helper
  const optimisticRemoveCard = useCallback((otherUserId: string): { previousSuggestions: EnhancedProfile[], removedProfile: EnhancedProfile | undefined } => {
    const previousSuggestions = [...suggestions];
    const removedProfile = suggestions.find(s => s.id === otherUserId);
    setSuggestions(prev => {
      const next = prev.filter(s => s.id !== otherUserId);
      const nextProfile = next[0];
      if (nextProfile) setAnnouncedProfile(`Now viewing ${nextProfile.display_name || nextProfile.name}, age ${nextProfile.age}. ${nextProfile.compatibility_score ?? 0}% compatible.`);
      return next;
    });
    return { previousSuggestions, removedProfile };
  }, [suggestions]);

  const handleConnect = useCallback(async (otherUserId: string) => {
    if (!currentUser) return;

    // Optimistic: immediately remove card
    const { previousSuggestions, removedProfile } = optimisticRemoveCard(otherUserId);
    setCelebrationTrigger(prev => prev + 1);
    trackEvent("swipe", { direction: "right", swiped_id: otherUserId });

    const { error: swipeError } = await supabase.from("swipes").insert({
      swiper_id: currentUser.id, swiped_id: otherUserId, direction: "right",
    });
    if (swipeError) {
      // Rollback
      setSuggestions(previousSuggestions);
      toast.error("Connection failed, try again");
      console.error("Swipe error:", swipeError);
      return;
    }

    const { data: matchData, error: matchError } = await supabase
      .rpc("check_match", { user1: currentUser.id, user2: otherUserId });
    if (matchError) { console.error("Match check error:", matchError); return; }

    if (matchData) {
      trackEvent("match", { matched_user_id: otherUserId });
      playMatch();
      if (removedProfile) { setMatchedUser(removedProfile); setShowMatchModal(true); }
      toast.success("You Both Said Yes 💜", { description: "You can now start chatting!" });
    } else {
      toast.success("Connection Sent", { description: "They'll be notified of your interest!" });
    }
  }, [currentUser, suggestions, optimisticRemoveCard]);

  const handlePass = useCallback(async (otherUserId: string) => {
    if (!currentUser) return;

    // Optimistic: immediately remove card
    const { previousSuggestions, removedProfile } = optimisticRemoveCard(otherUserId);
    trackEvent("swipe", { direction: "left", swiped_id: otherUserId });

    // Store for undo
    if (removedProfile) {
      setLastPassedProfile(removedProfile);
      setShowUndoButton(true);
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => setShowUndoButton(false), 5000);
    }

    const { error } = await supabase.rpc("record_pass", {
      _swiper_id: currentUser.id, _swiped_id: otherUserId,
    });
    if (error) {
      setSuggestions(previousSuggestions);
      setLastPassedProfile(null);
      setShowUndoButton(false);
      toast.error("Failed to pass, try again");
    }
  }, [currentUser, optimisticRemoveCard]);

  const getUndoLimit = useCallback(() => {
    if (subTier === "vip") return Infinity;
    if (subTier === "premium" || subTier === "plus") return 3;
    return 1;
  }, [subTier]);

  const handleUndo = useCallback(async () => {
    if (!currentUser || !lastPassedProfile) return;
    const limit = getUndoLimit();
    if (dailyUndoCount >= limit) {
      toast("Upgrade for more undos 👑", {
        action: { label: "Upgrade", onClick: () => navigate("/premium") },
      });
      return;
    }

    // Delete swipe record
    await supabase.from("swipes").delete().match({
      swiper_id: currentUser.id,
      swiped_id: lastPassedProfile.id,
    });

    // Re-insert at top
    setSuggestions(prev => [lastPassedProfile, ...prev]);
    setAnnouncedProfile(`Profile restored: ${lastPassedProfile.display_name || lastPassedProfile.name}`);
    setDailyUndoCount(c => c + 1);
    setLastPassedProfile(null);
    setShowUndoButton(false);
    clearTimeout(undoTimerRef.current);
    toast.success("Profile restored ↩️");
  }, [currentUser, lastPassedProfile, dailyUndoCount, getUndoLimit, navigate]);

  const handleSuperLike = useCallback(async (otherUserId: string) => {
    if (!currentUser) return;

    // Optimistic: immediately remove card and show toast
    const { previousSuggestions, removedProfile } = optimisticRemoveCard(otherUserId);
    setCelebrationTrigger(prev => prev + 1);
    trackEvent("super_like", { swiped_id: otherUserId });

    const success = await sendSuperLike(otherUserId);
    if (!success) {
      // Rollback
      setSuggestions(previousSuggestions);
      toast.error("No Thots left", { description: "Purchase more or wait until tomorrow." });
      return;
    }

    const { data: matchData } = await supabase
      .rpc("check_match", { user1: currentUser.id, user2: otherUserId });

    if (matchData) {
      trackEvent("match", { matched_user_id: otherUserId });
      playMatch();
      if (removedProfile) { setMatchedUser(removedProfile); setShowMatchModal(true); }
      toast.success("You Both Said Yes 💜", { description: "Your Thot worked!" });
    } else {
      playThot();
      toast.success("Thot Sent! 💜", { description: "They'll see you stand out!" });
    }
  }, [currentUser, suggestions, sendSuperLike, optimisticRemoveCard]);

  // Keyboard navigation for discovery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (suggestions.length === 0 || loading) return;
      const topProfile = suggestions[0];
      if (!topProfile) return;

      switch (e.key) {
        case "ArrowRight":
        case "l":
          e.preventDefault();
          handleConnect(topProfile.id);
          break;
        case "ArrowLeft":
        case "h":
          e.preventDefault();
          handlePass(topProfile.id);
          break;
        case "ArrowUp":
        case "s":
          e.preventDefault();
          if (canSuperLike) handleSuperLike(topProfile.id);
          break;
        case " ":
        case "Enter":
          e.preventDefault();
          setDetailProfile(topProfile);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [suggestions, loading, canSuperLike, handleConnect, handlePass, handleSuperLike]);

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
    return <PageSkeleton variant="discovery" />;
  }

  // Incomplete profile banner (Quick Start users)
  const showProfileBanner = currentUser && userBadgeCount < requiredCount;

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
                <Badge variant="outline" className="text-primary border-primary/30" title="Thots remaining" aria-label="Thots remaining">
                  <Heart className="h-3 w-3 mr-1 fill-current" />
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

      {/* Profile completion banner for Quick Start users */}
      {showProfileBanner && (
        <div className="max-w-sm mx-auto px-4 py-2">
          <button
            onClick={() => navigate("/learn")}
            className="w-full flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-sm"
          >
            <BookOpen className="h-4 w-4 text-primary shrink-0" />
            <span className="text-left">
              <span className="font-medium text-foreground">Complete your profile</span>
              <span className="text-muted-foreground"> — earn badges to unlock more matches</span>
            </span>
          </button>
        </div>
      )}

      {/* Compact Progress Strip */}
      {tiers.length > 0 && (
        <div className="max-w-sm mx-auto px-4 py-3">
          <CompactProgressBar tiers={tiers} badgeCount={userBadgeCount} connectionCount={matchCount} />
        </div>
      )}

      {/* Nearby Users */}
      {isSharing && (
        <div className="max-w-sm mx-auto px-4 mb-4">
          <NearbyUsers nearbyUsers={nearbyUsers} isSharing={isSharing} />
        </div>
      )}

      {/* Screen reader live region */}
      <div aria-live="polite" className="sr-only">
        {announcedProfile}
      </div>

      {/* Curated Matches Grid */}
      <div className="max-w-sm mx-auto px-4">
        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
            <BrandedEmptyState
              mascot="binoculars"
              headline="You've seen everyone nearby! 🔭"
              description="New people join every day. We'll let you know when someone new arrives."
            />
            <div className="flex flex-wrap gap-3 mt-6">
              <Button variant="outline" size="sm" onClick={() => navigate("/settings")} className="min-h-[44px]">
                <MapPin className="h-4 w-4 mr-1" /> Expand radius
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-primary-foreground min-h-[44px]" onClick={handleReferralClick}>
                <Share2 className="h-4 w-4 mr-1" /> Invite friends
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/events")} className="min-h-[44px]" aria-label="Browse upcoming events">
                🎪 Browse events
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px]"
                onClick={() => setShowResetDialog(true)}
              >
                <RefreshCw className="h-4 w-4 mr-1" /> Start Fresh
              </Button>
            </div>

            {/* Reset Feed Dialog */}
            <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset your discovery feed?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Profiles you previously passed on will reappear (except those you passed 3+ times). You can only do this once per week.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetFeed} disabled={resettingFeed}>
                    {resettingFeed ? "Resetting..." : "Reset Feed"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Boost upsell card */}
            <Card className="p-6 text-center max-w-sm mx-auto w-full mt-4">
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
          </div>
        ) : (
          <>
            <div className="relative flex justify-center items-start px-4 pt-2 pb-32" data-walkthrough="discovery-card" style={{ minHeight: '520px' }}>
              {/* Undo button */}
              {showUndoButton && lastPassedProfile && (
                <button
                  onClick={handleUndo}
                  className={`absolute top-4 left-4 z-30 bg-background/90 backdrop-blur-sm rounded-full p-3 shadow-md min-h-[44px] min-w-[44px] flex items-center gap-2 text-sm font-medium ${prefersReducedMotion ? '' : 'animate-fade-in'}`}
                  aria-label="Undo last pass"
                >
                  <Undo2 className="h-5 w-5" />
                </button>
              )}
              {suggestions.slice(0, 3).map((profile, stackIdx) => {
                const isMystery = mysteryProfiles.has(profile.id);
                if (isMystery && stackIdx === 0) {
                  return (
                    <MysteryMatchCard
                      key={profile.id}
                      profile={profile}
                      canReveal={canRevealMystery}
                      onReveal={handleMysteryReveal}
                      onConnect={handleConnect}
                      onPass={handlePass}
                      onSuperLike={handleSuperLike}
                      canSuperLike={canSuperLike}
                      superLikeBalance={isUnlimited ? 999 : superLikeBalance}
                      onUpgrade={handleMysteryUpgrade}
                    />
                  );
                }
                return (
                  <div key={profile.id} className="relative">
                    {profile.is_recycled && stackIdx === 0 && (
                      <div
                        className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1"
                        aria-label="Previously viewed profile"
                      >
                        <RefreshCw className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Second look</span>
                      </div>
                    )}
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
                  </div>
                );
              })}
            </div>
            {/* Desktop keyboard hints */}
            <div className="hidden md:flex gap-6 text-sm text-muted-foreground justify-center mt-3">
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">←</kbd> Pass</span>
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">↑</kbd> Send a Thot</span>
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">→</kbd> Connect</span>
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">Space</kbd> View profile</span>
            </div>
          </>
        )}
      </div>

      {matchedUser && (
        <MatchModal
          isOpen={showMatchModal}
          onClose={() => {
            setShowMatchModal(false);
            // Show compatibility breakdown after match celebration
            if (matchedUser && currentUser) {
              const bd = calculateCompatibilityBreakdown(
                currentUser, matchedUser, userBadgeCount, matchedUser.badge_count || 0
              );
              setMatchBreakdown(bd);
              setBreakdownName(matchedUser.name);
              setShowBreakdown(true);
            }
          }}
          matchedUser={matchedUser}
          onSendMessage={() => {
            setShowMatchModal(false);
            if (matchedUser && currentUser) {
              const bd = calculateCompatibilityBreakdown(
                currentUser, matchedUser, userBadgeCount, matchedUser.badge_count || 0
              );
              setMatchBreakdown(bd);
              setBreakdownName(matchedUser.name);
              setShowBreakdown(true);
            }
            navigate("/messages");
          }}
          isFirstMatch={matchCount === 0}
        />
      )}

      {/* Compatibility Breakdown Sheet */}
      <Sheet open={showBreakdown} onOpenChange={setShowBreakdown}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Compatibility</SheetTitle>
          </SheetHeader>
          {matchBreakdown && (
            <CompatibilityBreakdown
              breakdown={matchBreakdown}
              otherName={breakdownName}
              className="pb-6"
            />
          )}
        </SheetContent>
      </Sheet>

      <ProfileDetailSheet
        profile={detailProfile}
        onClose={() => setDetailProfile(null)}
        onConnect={(id) => { handleConnect(id); setDetailProfile(null); }}
        onPass={(id) => { handlePass(id); setDetailProfile(null); }}
        onSuperLike={handleSuperLike}
        canSuperLike={canSuperLike}
      />

      <BottomNav />

      {/* First-time walkthrough */}
      {showWalkthrough && suggestions.length > 0 && (
        <DiscoveryWalkthrough onComplete={() => {
          setShowWalkthrough(false);
          if (shouldShowSwipeTutorial()) setShowSwipeTutorial(true);
        }} />
      )}

      {/* Mobile swipe tutorial */}
      {showSwipeTutorial && !showWalkthrough && (
        <SwipeTutorial onDismiss={() => setShowSwipeTutorial(false)} />
      )}
    </div>
  );
};

export default Index;
