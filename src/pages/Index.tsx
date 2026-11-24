import { useEffect, useState, useCallback, useRef, type CSSProperties } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { onDiscoveryRefresh } from "@/lib/discoveryEvents";
import { useSessionStore } from "@/stores/sessionStore";
import { Button } from "@/components/ui/button";
import { Heart, Settings, Zap, Share2, Undo2, RefreshCw, ChevronRight, CalendarDays, SlidersHorizontal } from "lucide-react";
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
import { NearbyUsers } from "@/components/NearbyUsers";
import { SwipeDiscoveryCard } from "@/components/discovery/SwipeDiscoveryCard";
import { ProfileDetailSheet } from "@/components/discovery/ProfileDetailSheet";
import { CompactProgressBar, LearnProgressStrip } from "@/components/discovery/CompactProgressBar";
import { MysteryMatchCard } from "@/components/discovery/MysteryMatchCard";
import { DiscoveryWalkthrough } from "@/components/discovery/DiscoveryWalkthrough";
import { useTutorialState } from "@/hooks/useTutorialState";
import { AppFooter } from "@/components/AppFooter";
import { SwipeTutorial, shouldShowSwipeTutorial } from "@/components/discovery/SwipeTutorial";
import { useLocationSharing } from "@/hooks/useLocationSharing";
import { useSuperLikes } from "@/hooks/useSuperLikes";
import { useFeatureUnlocks } from "@/hooks/useFeatureUnlocks";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useSubscription } from "@/hooks/useSubscription";
import { PageSkeleton } from "@/components/PageSkeleton";
import { toast } from "sonner";
import { PAYMENTS_OPEN } from "@/lib/payments";
import { canUseAdvancedFilters, memberPerks, sectionsFinished } from "@/lib/perks";
import { filterOptions, filtersActive, loadFilters, passesFilters, saveFilters, NO_FILTERS, type DiscoverFilters } from "@/lib/discoverFilters";
import { DiscoverFilterSheet } from "@/components/discovery/DiscoverFilterSheet";
import { SEO } from "@/components/SEO";
import type { Database } from "@/integrations/supabase/types";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { IncognitoIndicator } from "@/components/layout/IncognitoIndicator";

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
  has_priority?: boolean;
  is_mentor?: boolean;
  photo_focal_points?: Record<string, number>;
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

const KeyboardHints = () => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 7000);
    return () => clearTimeout(timer);
  }, []);
  if (!visible) return null;
  return (
    <div className="hidden xl:flex gap-6 text-sm text-muted-foreground justify-center py-2 animate-fade-in">
      <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">←</kbd> Pass</span>
      <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">↑</kbd> Send a Thot</span>
      <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">→</kbd> Connect</span>
      <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">Space</kbd> View profile</span>
    </div>
  );
};

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
  const [userBadgeCount, setUserBadgeCount] = useState(0);
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewProfiles, setPreviewProfiles] = useState<EnhancedProfile[]>([]);
  const [requiredCount, setRequiredCount] = useState(5);
  const [detailProfile, setDetailProfile] = useState<EnhancedProfile | null>(null);
  const [matchCount, setMatchCount] = useState(0);
  const [mysteryRevealsUsed, setMysteryRevealsUsed] = useState(0);
  // Extra reveals won on the daily spin. They are spent only after the day's own reveals run out.
  const [bonusMysteryReveals, setBonusMysteryReveals] = useState(0);
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
  // The list of people failed to load (as opposed to loading fine and being empty).
  const [loadError, setLoadError] = useState(false);
  // Advanced filters: earned by finishing the Identity lessons, or included with Premium and VIP.
  const [filters, setFilters] = useState<DiscoverFilters>(() => loadFilters());
  const filtersRef = useRef(filters);
  const [showFilters, setShowFilters] = useState(false);
  const [filterChoices, setFilterChoices] = useState<{ genders: string[]; styles: string[] }>({ genders: [], styles: [] });
  const canFilter = canUseAdvancedFilters(subTier, new Set(tiers.filter(t => t.isComplete).map(t => t.tier)));
  const canFilterRef = useRef(canFilter);
  canFilterRef.current = canFilter;
  const applyFilters = (next: DiscoverFilters) => {
    filtersRef.current = next;
    setFilters(next);
    saveFilters(next);
    if (currentUser) { setLoading(true); void loadSuggestions(currentUser.id, currentUser); }
  };
  const [retrying, setRetrying] = useState(false);

  // Handle super like purchase redirect
  useEffect(() => {
    if (searchParams.get("superlikes") === "purchased") {
      toast.success("Thots purchased! 💜", { description: "10 Thots added to your balance." });
    }
  }, [searchParams]);

  // First-visit tours. Each opens once: only after we know the member has not finished it.
  const { seen: walkthroughSeen, ready: walkthroughReady } = useTutorialState("discovery_walkthrough");
  const { seen: swipeTutorialSeen, ready: swipeTutorialReady, markSeen: markSwipeTutorialSeen } =
    useTutorialState("swipe_tutorial");

  // Deferred walkthrough check: wait for the profiles to load and for the saved tour answers.
  useEffect(() => {
    if (!showWalkthroughPending || loading || !walkthroughReady || !swipeTutorialReady) return;
    setShowWalkthroughPending(false);
    if (suggestions.length === 0) return;
    if (!walkthroughSeen) {
      setTimeout(() => setShowWalkthrough(true), 500);
    } else if (!swipeTutorialSeen && shouldShowSwipeTutorial()) {
      setTimeout(() => setShowSwipeTutorial(true), 500);
    }
  }, [showWalkthroughPending, loading, suggestions.length, walkthroughReady, swipeTutorialReady, walkthroughSeen, swipeTutorialSeen]);

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

  // Subscribe to discovery refresh events (e.g. from unlike on Likes page)
  useEffect(() => {
    const unsub = onDiscoveryRefresh(() => {
      if (currentUser) loadSuggestions(currentUser.id, currentUser);
    });
    return unsub;
  }, [currentUser]);


  // Refetch on window focus if suggestions are empty
  useEffect(() => {
    const handleFocus = () => {
      if (currentUser && suggestions.length === 0) {
        loadSuggestions(currentUser.id, currentUser);
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [currentUser, suggestions.length]);
  const handleResetFeed = useCallback(async () => {
    const lastReset = useSessionStore.getState().getSessionData("pt_last_feed_reset", null);
    if (lastReset) {
      const daysSince = Math.floor((Date.now() - lastReset) / (1000 * 60 * 60 * 24));
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
    useSessionStore.getState().setSessionData("pt_last_feed_reset", Date.now());
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

    // Tutorial flags are managed by useTutorialState hook (DB-backed)
    // No localStorage sync needed

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
    // Perks other members can see the effect of. A failure here only means nobody is moved up or badged.
    const [modulesResult, planPerksResult] = await Promise.all([
      supabase.from("education_modules").select("id, tier"),
      (supabase.rpc.bind(supabase) as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ data: { user_id: string; priority: boolean; mentor: boolean }[] | null }>)(
        "get_plan_perks", { _ids: (profilesResult.data ?? []).map((p: { id: string }) => p.id) }).catch(() => ({ data: null })),
    ]);
    const planFlags = new Map<string, { priority: boolean; mentor: boolean }>((planPerksResult.data ?? []).map(r => [r.user_id, r]));
    const earnedByUser = new Map<string, Set<string>>();
    allBadgesResult.data?.forEach(badge => {
      if (!earnedByUser.has(badge.user_id)) earnedByUser.set(badge.user_id, new Set());
      earnedByUser.get(badge.user_id)!.add(badge.module_id);
    });
    const perksOf = (id: string) => memberPerks(planFlags.get(id), sectionsFinished(modulesResult.data ?? [], earnedByUser.get(id) ?? new Set()));

    if (profilesResult.error || !profilesResult.data) {
      setLoadError(true);
      return;
    }
    setLoadError(false);

    // Enrich with actual approved photos from user_photos table
    const profileIds = profilesResult.data.map(p => p.id);
    const { data: userPhotos } = await supabase
      .from("user_photos")
      .select("user_id, photo_url, order_index, focal_point_y")
      .in("user_id", profileIds)
      .eq("visibility", "public")
      .eq("moderation_status", "approved")
      .order("order_index", { ascending: true });

    const photosByUser = new Map<string, { url: string; focalY: number }[]>();
    userPhotos?.forEach(photo => {
      const existing = photosByUser.get(photo.user_id) || [];
      existing.push({ url: photo.photo_url, focalY: Number(photo.focal_point_y) || 50 });
      photosByUser.set(photo.user_id, existing);
    });

    const badgeCounts = new Map<string, number>();
    allBadgesResult.data?.forEach(badge => {
      badgeCounts.set(badge.user_id, (badgeCounts.get(badge.user_id) || 0) + 1);
    });

    const boostedUserIds = new Set(boostsResult.data?.map(b => b.user_id) || []);

    setFilterChoices(filterOptions(profilesResult.data ?? []));
    const enhancedProfiles: EnhancedProfile[] = profilesResult.data
      .filter(p => {
        // Only include profiles that have at least one approved public photo and are not suspended
        const approvedPhotos = photosByUser.get(p.id);
        if (!approvedPhotos || approvedPhotos.length === 0) return false;
        if ((p as any).is_suspended) return false;
        if (canFilterRef.current && !passesFilters(p, filtersRef.current)) return false;
        return true;
      })
      .map(p => {
        const userPhotoData = photosByUser.get(p.id) || [];
        const focalMap: Record<string, number> = {};
        userPhotoData.forEach(ph => { focalMap[ph.url] = ph.focalY; });
        return {
        ...p,
        profile_image: userPhotoData[0]?.url || p.profile_image || null,
        photos: userPhotoData.length > 1 ? userPhotoData.slice(1).map(ph => ph.url) : null,
        photo_focal_points: focalMap,
        badge_count: badgeCounts.get(p.id) || 0,
        compatibility_score: calculateCompatibility(profile, p, badgeCounts.get(p.id) || 0, badgeCounts.get(userId) || 0),
        compatibility_reasons: calculateCompatibilityReasons(profile, p, badgeCounts.get(p.id) || 0, badgeCounts.get(userId) || 0, isSharing),
        verified: p.is_verified,
        distance: null,
        is_boosted: boostedUserIds.has(p.id),
        has_priority: perksOf(p.id).priority,
        is_mentor: perksOf(p.id).mentor,
      };})
      .sort((a, b) => {
        if (a.is_boosted && !b.is_boosted) return -1;
        if (!a.is_boosted && b.is_boosted) return 1;
        // Priority visibility: after an active Boost, before everyone else.
        if (a.has_priority && !b.has_priority) return -1;
        if (!a.has_priority && b.has_priority) return 1;
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
      .select("*")
      .eq("id", userId)
      .single();
    if (revealData) {
      const today = new Date().toISOString().split("T")[0];
      setMysteryRevealsUsed(
        (revealData as any).mystery_reveals_date === today ? (revealData as any).mystery_reveals_today : 0
      );
      setBonusMysteryReveals((revealData as any).bonus_mystery_reveals ?? 0);
    }

    setSuggestions(enhancedProfiles.slice(0, 15));
  };

  const mysteryRevealLimit = getMysteryRevealLimit(subTier);
  const hasDailyReveal = mysteryRevealsUsed < mysteryRevealLimit;
  const canRevealMystery = hasDailyReveal || bonusMysteryReveals > 0;

  const handleMysteryReveal = useCallback(async (): Promise<boolean> => {
    if (!currentUser || !canRevealMystery) return false;
    if (!hasDailyReveal) {
      // The day's reveals are used up: spend one won on the daily spin.
      const left = bonusMysteryReveals - 1;
      await supabase.from("profiles").update({ bonus_mystery_reveals: left } as any).eq("id", currentUser.id);
      setBonusMysteryReveals(left);
      trackEvent("mystery_match_reveal", { bonus: true });
      return true;
    }
    const today = new Date().toISOString().split("T")[0];
    const newCount = mysteryRevealsUsed + 1;
    await supabase.from("profiles").update({
      mystery_reveals_today: newCount,
      mystery_reveals_date: today,
    } as any).eq("id", currentUser.id);
    setMysteryRevealsUsed(newCount);
    trackEvent("mystery_match_reveal", {});
    return true;
  }, [currentUser, canRevealMystery, hasDailyReveal, bonusMysteryReveals, mysteryRevealsUsed]);

  // Once revealed, the person is shown on the ordinary card, with Connect and Send a Thot.
  const handleMysteryRevealed = useCallback((id: string) => {
    setMysteryProfiles(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleMysteryUpgrade = useCallback(() => {
    toast("Want to reveal more Mystery Matches?", {
      description: "Upgrade to Plus for 3 daily reveals! 💜",
      action: { label: "Upgrade", onClick: () => navigate("/premium") },
      duration: 5000,
    });
  }, [navigate]);

  // Remove a profile from the feed when all its images fail to load
  const handleBrokenProfile = useCallback((profileId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== profileId));
  }, []);

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

    const { error: swipeError } = await supabase.from("swipes").upsert({
      swiper_id: currentUser.id, swiped_id: otherUserId, direction: "right",
    }, { onConflict: "swiper_id,swiped_id" });
    if (swipeError) {
      // Rollback
      setSuggestions(previousSuggestions);
      toast.error("Connection failed, try again");
      console.error("Swipe error:", swipeError);
      return;
    }

    const { data: matchData, error: matchError } = await supabase
      .rpc("check_match", { user1: currentUser.id, user2: otherUserId });
    if (matchError) {
      console.error("Match check error:", matchError);
      setSuggestions(previousSuggestions);
      toast.error("Connection couldn't be saved. Please try again.");
      return;
    }

    if (matchData) {
      trackEvent("match", { matched_user_id: otherUserId });
      playMatch();
      // The celebration says it; a toast on top of it would only cover the buttons.
      if (removedProfile) { setMatchedUser(removedProfile); setShowMatchModal(true); }
      else toast.success("You Both Said Yes 💜", { description: "You can now start chatting!" });
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
      else toast.success("You Both Said Yes 💜", { description: "Your Thot worked!" });
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
    // Buying a Boost is a checkout. While checkout is closed the button leads to Profile, where an earned Boost is used.
    if (!PAYMENTS_OPEN) { navigate("/profile"); return; }
    try {
      const { data, error } = await supabase.functions.invoke("create-boost-payment");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      toast.error("Failed to start boost checkout");
    }
  };

  const handleRetryLoad = async () => {
    if (!currentUser || retrying) return;
    setRetrying(true);
    try {
      await loadSuggestions(currentUser.id, currentUser);
    } catch {
      setLoadError(true);
    } finally {
      setRetrying(false);
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
      const link = `https://positivethots.app/auth?ref=${code}`;
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

  return (
    <div className="kit-area-discover discover-screen">
      <SEO
        title="Positive Thots — Learn first. Connect better."
        description="Education-first relationship wellness platform for every relationship style. Learn first. Connect better."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "MobileApplication",
          name: "Positive Thots",
          applicationCategory: "SocialNetworkingApplication",
          operatingSystem: "iOS, Android, Web",
          description: "Education-first relationship wellness platform for every relationship style.",
          url: "https://positivethots.app",
        }}
      />
      <MicroCelebration trigger={celebrationTrigger} emojis={["💕", "✨", "💜", "🔥"]} />
      <h1 className="sr-only">Positive Thots — Learn first. Connect better.</h1>


      {/* Header: kept short so the person on the card gets the room. */}
      <header className="kit-header z-40 shrink-0">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2 px-4 py-1 md:max-w-2xl lg:max-w-4xl">
          <Logo size="md" showText={false} />
          <div className="flex items-center gap-2">
            <span
              className="kit-chip"
              data-tone="area"
              aria-label={isUnlimited ? "Unlimited Thots" : `${superLikeBalance} ${superLikeBalance === 1 ? "Thot" : "Thots"} left to send`}
            >
              <Heart className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              {isUnlimited ? "∞" : superLikeBalance}
            </span>
            <button type="button" className="discover-icon-btn" data-tone="reward" aria-label="Boost your profile" onClick={handleBoostClick}>
              <Zap aria-hidden="true" />
            </button>
            <IncognitoIndicator />
            <button type="button" className="discover-icon-btn relative" aria-label={canFilter && filtersActive(filters) ? "Filters, on" : "Filters"} onClick={() => setShowFilters(true)}>
              <SlidersHorizontal aria-hidden="true" />
              {canFilter && filtersActive(filters) && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" aria-hidden="true" />}
            </button>
            <button type="button" className="discover-icon-btn" aria-label="Settings" onClick={() => navigate("/settings")}>
              <Settings aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Learning progress. With someone on the card it is one slim row; with no one to show it is the full card (below). */}
      {suggestions.length > 0 && tiers.length > 0 && (
        <div className="mx-auto w-full max-w-md shrink-0 px-4 pt-2 md:max-w-2xl lg:max-w-4xl">
          <LearnProgressStrip tiers={tiers} />
        </div>
      )}

      {/* Nearby Users */}
      {isSharing && (
        <div className="mx-auto w-full max-w-md shrink-0 px-4 pt-2 md:max-w-2xl lg:max-w-4xl">
          <NearbyUsers nearbyUsers={nearbyUsers} isSharing={isSharing} />
        </div>
      )}

      {/* Screen reader live region */}
      <div aria-live="polite" className="sr-only">
        {announcedProfile}
      </div>

      {/* The stage: someone to meet, or what to do while there is no one. */}
      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-4 pt-2 md:max-w-2xl lg:max-w-4xl">
        {loadError && suggestions.length === 0 ? (
          <div className="flex h-full flex-col items-center overflow-y-auto pb-24 text-center">
            <BrandedEmptyState
              mascot="confused"
              headline="We couldn't load Discover."
              description="Check your connection and try again."
              className="shrink-0 px-2 py-4"
              ctaLabel={retrying ? "Trying again…" : "Try again"}
              onCtaClick={handleRetryLoad}
            />
            <AppFooter inline />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="discovery-empty flex h-full flex-col items-stretch overflow-y-auto pb-24">
            <BrandedEmptyState
              mascot="binoculars"
              headline="You've seen everyone nearby."
              description="Widen your range, or keep learning while new people join."
              className="shrink-0 px-2 py-3"
              ctaLabel="Expand radius"
              onCtaClick={() => navigate("/settings")}
            />

            {/* Learning is the best use of the wait: it also raises your place in Discover. */}
            {tiers.length > 0 && (
              <div className="kit-rise mt-2 shrink-0" style={{ "--i": 1 } as CSSProperties}>
                <CompactProgressBar tiers={tiers} badgeCount={userBadgeCount} connectionCount={matchCount} />
              </div>
            )}

            {canFilter && filtersActive(filters) && (
              <button type="button" className="kit-row kit-row-next mt-4" onClick={() => applyFilters(NO_FILTERS)}>
                <span className="kit-coin" data-tone="area"><SlidersHorizontal aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold leading-tight">Your filters are on</span>
                  <span className="block text-sm text-muted-foreground">Clear them to see everyone.</span>
                </span>
              </button>
            )}
            <h2 className="kit-eyebrow mt-6 px-1">While you wait</h2>
            <div className="mt-2 grid shrink-0 gap-2.5">
              <button type="button" className="kit-row kit-rise" style={{ "--i": 2 } as CSSProperties} onClick={handleReferralClick}>
                <span className="kit-coin" data-tone="pink"><Share2 aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold leading-tight">Invite friends</span>
                  <span className="block text-sm text-muted-foreground">Share your link and grow who you can meet.</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              </button>
              <button type="button" className="kit-row kit-rise" style={{ "--i": 3 } as CSSProperties} onClick={() => navigate("/events")}>
                <span className="kit-coin" data-tone="info"><CalendarDays aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold leading-tight">Browse events</span>
                  <span className="block text-sm text-muted-foreground">Meet the community in person or online.</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              </button>
              <button type="button" className="kit-row kit-rise" style={{ "--i": 4 } as CSSProperties} onClick={() => setShowResetDialog(true)}>
                <span className="kit-coin" data-tone="quiet"><RefreshCw aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold leading-tight">Start fresh</span>
                  <span className="block text-sm text-muted-foreground">See people you passed on again. Once a week.</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              </button>
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

            {/* Boost */}
            <div className="kit-card kit-rise mt-6 flex shrink-0 items-center gap-3 p-4" style={{ "--i": 5 } as CSSProperties}>
              <span className="kit-coin kit-coin-lg" data-tone="reward"><Zap aria-hidden="true" /></span>
              <div className="min-w-0 flex-1 text-left">
                <h2 className="font-bold leading-tight">Get seen by more people</h2>
                <p className="text-sm text-muted-foreground [text-wrap:pretty]">{PAYMENTS_OPEN ? "A Profile Boost puts you at the top of Discover for 24 hours. $2.99." : "A Profile Boost puts you at the top of Discover for 24 hours. Win one on the daily spin or in the weekly sprint."}</p>
              </div>
              <Button variant="outline" className="min-h-[44px] shrink-0 px-4 font-bold" onClick={handleBoostClick}>Boost</Button>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              Think Positive Thots.<sup className="opacity-70" style={{ fontSize: "60%", verticalAlign: "super" }}>TM</sup>
            </p>
            {/* Discover does not scroll, so the policy links live at the end of this list. */}
            <AppFooter inline />
          </div>
        ) : (
          <>
            <div className="discover-stage">
              {/* Undo button */}
              {showUndoButton && lastPassedProfile && (
                <button
                  onClick={handleUndo}
                  className={`absolute top-12 left-3 z-40 flex min-h-[44px] items-center gap-2 rounded-full bg-background/90 px-4 text-sm font-bold shadow-md backdrop-blur-sm ${prefersReducedMotion ? '' : 'animate-fade-in'}`}
                  aria-label="Undo last pass"
                >
                  <Undo2 className="h-5 w-5" aria-hidden="true" /> Undo
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
                      onRevealed={handleMysteryRevealed}
                      onPass={handlePass}
                      onUpgrade={handleMysteryUpgrade}
                    />
                  );
                }
                return (
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
                    onUpgradeSuperLike={() => navigate("/premium")}
                    onAllImagesFailed={() => handleBrokenProfile(profile.id)}
                  />
                );
              })}
            </div>
            {/* Desktop keyboard hints — auto-dismiss after 7s */}
            <KeyboardHints />
          </>
        )}
      </div>

      <DiscoverFilterSheet open={showFilters} onOpenChange={setShowFilters} unlocked={canFilter} value={filters} options={filterChoices}
        onApply={applyFilters} onLearn={() => navigate("/learn")} onPlans={() => navigate("/premium")} />

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
        canSuperLike={canSuperLike && (isUnlimited || superLikeBalance > 0)}
      />

      <div className="shrink-0">
        <BottomNav />
      </div>

      {/* First-time walkthrough */}
      {showWalkthrough && suggestions.length > 0 && (
        <DiscoveryWalkthrough onComplete={() => {
          setShowWalkthrough(false);
          if (!swipeTutorialSeen && shouldShowSwipeTutorial()) setShowSwipeTutorial(true);
        }} />
      )}

      {/* Mobile swipe tutorial */}
      {showSwipeTutorial && !showWalkthrough && (
        <SwipeTutorial onDismiss={() => { setShowSwipeTutorial(false); markSwipeTutorialSeen(); }} />
      )}
    </div>
  );
};

export default Index;
