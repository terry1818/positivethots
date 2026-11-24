import { GuideArt } from "@/components/mascot/GuideArt";
import { useEffect, useState, type CSSProperties } from "react";
import { useTutorialState } from "@/hooks/useTutorialState";
import { SpotlightTour, type TourStep } from "@/components/SpotlightTour";
import { BlurImage } from "@/components/BlurImage";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { triggerDiscoveryRefresh } from "@/lib/discoveryEvents";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MicroCelebration } from "@/components/onboarding/MicroCelebration";
import { ProfileDetailSheet } from "@/components/discovery/ProfileDetailSheet";
import { Heart, Crown, Star, MapPin, ChevronRight } from "lucide-react";
import { MatchModal } from "@/components/MatchModal";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { BrandedEmptyState } from "@/components/BrandedEmptyState";
import { Logo } from "@/components/Logo";

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

interface LikerProfile {
  id: string; name: string; age: number; profile_image?: string; location?: string; bio?: string;
  is_super_like?: boolean;
}

interface SentLikeProfile {
  id: string; name: string; age: number; profile_image?: string; location?: string; swiped_at?: string;
}

interface DetailProfile {
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

const LikesYou = () => {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [isPremium, setIsPremium] = useState(false);
  const { seen: likesTourSeen, markSeen: markLikesTourSeen } = useTutorialState("likes_tour");
  const [showLikesTour, setShowLikesTour] = useState(false);
  const [detailProfile, setDetailProfile] = useState<DetailProfile | null>(null);

  const likesTourSteps: TourStep[] = [
    { target: "likes-tab-likes-you", title: "Who wants to connect", description: "People who've Connected with you appear here. Connect back and you can start chatting.", position: "below" },
    { target: "likes-tab-your-likes", title: "Your Connects", description: "See everyone you've Connected with. Remove a Connect if you change your mind.", position: "below" },
  ];
  const [likers, setLikers] = useState<LikerProfile[]>([]);
  const [likerCount, setLikerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);
  const [unlikeTarget, setUnlikeTarget] = useState<SentLikeProfile | null>(null);
  // The list failed to load (as opposed to loading fine and being empty). reloadKey asks for another try.
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [sentError, setSentError] = useState(false);
  // The person just Connected with, for the "You Both Said Yes" moment.
  const [saidYes, setSaidYes] = useState<{ profile: LikerProfile; matchId: string | null } | null>(null);
  const { playMatch } = useSoundEffects();

  // Sent likes state
  const [sentLikes, setSentLikes] = useState<SentLikeProfile[]>([]);
  const [sentLoading, setSentLoading] = useState(false);
  const [sentFetched, setSentFetched] = useState(false);

  // Enrich profiles with approved photos from user_photos
  const enrichWithPhotos = async (profileIds: string[]): Promise<Map<string, string>> => {
    if (profileIds.length === 0) return new Map();
    const { data } = await supabase
      .from("user_photos")
      .select("user_id, photo_url, order_index")
      .in("user_id", profileIds)
      .eq("visibility", "public")
      .eq("moderation_status", "approved")
      .order("order_index", { ascending: true });
    
    const bestPhoto = new Map<string, string>();
    data?.forEach(p => {
      if (!bestPhoto.has(p.user_id)) {
        bestPhoto.set(p.user_id, p.photo_url);
      }
    });
    return bestPhoto;
  };

  useEffect(() => {
    const fetchLikers = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data, error } = await supabase.rpc("get_likers_for_user", { _user_id: user.id });
      
      if (error) {
        console.error("Error fetching likers:", error);
        setLoadError(true);
        setLoading(false);
        return;
      }
      setLoadError(false);

      if (!data || data.length === 0) {
        setLikers([]);
        setLikerCount(0);
        setLoading(false);
        return;
      }

      const firstRow = data[0];
      const premium = firstRow.is_premium;
      const count = firstRow.liker_count;
      setIsPremium(premium);
      setLikerCount(count);

      if (premium && firstRow.id) {
        const profiles: LikerProfile[] = data
          .filter((r: any) => r.id != null)
          .map((r: any) => ({
            id: r.id,
            name: r.name,
            age: r.age,
            profile_image: r.profile_image,
            location: r.location,
            bio: r.bio,
            is_super_like: r.is_super_like,
          }));

        // Enrich with approved photos and filter out profiles with no valid photo
        const photoMap = await enrichWithPhotos(profiles.map(p => p.id));
        const enriched = profiles.map(p => ({
          ...p,
          profile_image: photoMap.get(p.id) || p.profile_image,
        })).filter(p => p.profile_image);

        setLikers(enriched);
      } else {
        setLikers([]);
      }

      setLoading(false);
    };
    fetchLikers();
  }, [navigate, reloadKey]);

  // Show likes tour after loading
  useEffect(() => {
    if (!loading && !likesTourSeen) {
      setTimeout(() => setShowLikesTour(true), 600);
    }
  }, [loading, likesTourSeen]);

  const fetchSentLikes = async (force = false) => {
    if (sentFetched && !force) return;
    setSentLoading(true);
    setSentError(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSentLoading(false); return; }

    const { data, error } = await supabase.rpc("get_sent_likes", { _user_id: user.id });
    if (error) {
      console.error("Error fetching sent likes:", error);
      setSentError(true);
    } else if (data) {
      const profiles = data as SentLikeProfile[];
      // Enrich with approved photos and filter
      const photoMap = await enrichWithPhotos(profiles.map(p => p.id));
      const enriched = profiles.map(p => ({
        ...p,
        profile_image: photoMap.get(p.id) || p.profile_image,
      })).filter(p => p.profile_image);
      setSentLikes(enriched);
    }
    setSentLoading(false);
    setSentFetched(true);
  };

  // They already said yes, so a Connect here is always mutual: celebrate it.
  const handleConnect = async (likerId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const liker = likers.find(l => l.id === likerId);
    const { error } = await supabase.from("swipes").upsert({ swiper_id: user.id, swiped_id: likerId, direction: "right" }, { onConflict: "swiper_id,swiped_id" });
    if (error) {
      toast({ title: "That didn't go through", description: "Check your connection and try again.", variant: "destructive" });
      return;
    }
    const { data: matchId } = await supabase.rpc("check_match", { user1: user.id, user2: likerId });
    setLikers(prev => prev.filter(l => l.id !== likerId));
    setLikerCount(prev => Math.max(0, prev - 1));
    if (matchId) {
      setCelebrationTrigger(prev => prev + 1);
      playMatch();
      if (liker) setSaidYes({ profile: liker, matchId: typeof matchId === "string" ? matchId : null });
      else toast({ title: "You Both Said Yes 💜", description: "You can now start chatting." });
    }
  };

  const handlePass = async (likerId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("swipes").upsert({ swiper_id: user.id, swiped_id: likerId, direction: "left" }, { onConflict: "swiper_id,swiped_id" });
    if (error) {
      toast({ title: "That didn't go through", description: "Check your connection and try again.", variant: "destructive" });
      return;
    }
    setLikers(prev => prev.filter(l => l.id !== likerId));
    setLikerCount(prev => Math.max(0, prev - 1));
  };

  const handleTabChange = (value: string) => {
    if (value === "your-likes") {
      fetchSentLikes();
    }
  };

  const openProfileDetail = async (profileId: string) => {
    const { data } = await supabase.rpc("get_public_profile", { _user_id: profileId });
    if (data && data.length > 0) {
      const p = data[0] as any;
      setDetailProfile({
        id: p.id,
        name: p.name,
        age: p.age,
        bio: p.bio || null,
        location: p.location || null,
        profile_image: p.profile_image || null,
        gender: p.gender || null,
        pronouns: p.pronouns || null,
        relationship_style: p.relationship_style || null,
        relationship_status: p.relationship_status || null,
        experience_level: p.experience_level || null,
        interests: p.interests || null,
        photos: p.photos || null,
        display_name: p.display_name || null,
        is_verified: p.is_verified || false,
        looking_for: p.looking_for || null,
        zodiac_sign: p.zodiac_sign || null,
        languages: p.languages || null,
        height_cm: p.height_cm || null,
      });
    }
  };

  const waiting = likerCount === 1 ? "1 person wants to connect" : `${likerCount} people want to connect`;

  return (
    <div className="kit-area-likes min-h-screen bg-background flex flex-col">
      <MicroCelebration trigger={celebrationTrigger} emojis={["🎉", "💕", "✨", "💜"]} />
      <header className="kit-header sticky top-0 z-30">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 py-1 md:max-w-2xl lg:max-w-4xl">
          <Logo size="md" showText={false} />
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="text-xl font-extrabold">Likes</h1>
            {likerCount > 0 && (
              <span className="kit-chip" data-tone="area" aria-label={waiting}>{likerCount}</span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-6 pt-3 md:max-w-2xl lg:max-w-4xl">
        <Tabs defaultValue="likes-you" onValueChange={handleTabChange}>
          <TabsList className="kit-tabs">
            <TabsTrigger value="likes-you" className="kit-tab" data-tour="likes-tab-likes-you">Wants to connect</TabsTrigger>
            <TabsTrigger value="your-likes" className="kit-tab" data-tour="likes-tab-your-likes">Your Connects</TabsTrigger>
          </TabsList>

          <TabsContent value="likes-you" className="mt-4">
            {loading ? (
              <div className="grid grid-cols-2 gap-3" aria-busy="true" aria-label="Loading">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="overflow-hidden rounded-[20px] border-2 border-border">
                    <Skeleton className="aspect-[3/4] w-full rounded-none" />
                    <Skeleton className="h-12 w-full rounded-none" />
                  </div>
                ))}
              </div>
            ) : loadError ? (
              <BrandedEmptyState
                mascot="confused"
                headline="We couldn't load your Likes."
                description="Check your connection and try again."
                ctaLabel="Try again"
                onCtaClick={() => { setLoading(true); setReloadKey(k => k + 1); }}
                className="py-4"
              />
            ) : likerCount === 0 ? (
              <div className="space-y-4">
                <BrandedEmptyState
                  mascot="waving"
                  headline="Your admirers are on their way! 💜"
                  description="Every badge you earn moves you up in Discover, so more people see you."
                  ctaLabel="Keep learning"
                  onCtaClick={() => navigate("/learn")}
                  className="py-3"
                />
                {!isPremium && (
                  <div className="kit-card kit-rise flex items-center gap-3 p-4">
                    <span className="kit-coin kit-coin-lg" data-tone="reward"><Crown aria-hidden="true" /></span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold leading-tight">See who wants to connect</h2>
                      <p className="text-sm text-muted-foreground [text-wrap:pretty]">A plan shows you each person the moment they Connect.</p>
                    </div>
                    <Button variant="outline" className="min-h-[44px] shrink-0 px-4 font-bold" onClick={() => navigate("/premium")}>See plans</Button>
                  </div>
                )}
              </div>
            ) : !isPremium ? (
              <div className="space-y-4">
                {/* They are here, but hidden. Shapes only: no names or photos are sent to this screen. */}
                <div className="kit-panel h-[230px]">
                  <div className="flex flex-col items-center pb-3">
                    <GuideArt name="guide-chest-open" size={150} />
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-extrabold [text-wrap:balance]">{waiting} with you</h2>
                  <p className="mt-1 text-muted-foreground [text-wrap:pretty]">A plan shows you who they are, so you can say yes.</p>
                </div>
                <Button className="kit-cta w-full" onClick={() => navigate("/premium")}>See who they are</Button>
                <button type="button" className="kit-row" onClick={() => navigate("/")}>
                  <span className="kit-coin" data-tone="pink"><Heart aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold leading-tight">Keep exploring Discover</span>
                    <span className="block text-sm text-muted-foreground">Connect with someone who already said yes and you both find out.</span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {likers.map((liker, idx) => (
                  <li key={liker.id} className={cn("kit-card likes-card", !reducedMotion && "kit-rise")} style={{ "--i": Math.min(idx, 8) } as CSSProperties}>
                    <button type="button" className="likes-photo block w-full text-left" onClick={() => openProfileDetail(liker.id)} aria-label={`View ${liker.name}'s profile`}>
                      {liker.profile_image ? (
                        <BlurImage src={liker.profile_image} alt="" className="absolute inset-0 h-full w-full" loading="lazy" sizes="(max-width: 375px) 170px, 200px" />
                      ) : (
                        <span className="absolute inset-0 grid place-items-center text-4xl font-extrabold text-muted-foreground">{liker.name?.[0] || "?"}</span>
                      )}
                      <span className="likes-photo-shade" />
                      {liker.is_super_like && (
                        <span className="kit-chip absolute left-2 top-2"><Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" /> <span><span className="hidden min-[360px]:inline">Sent a </span>Thot</span></span>
                      )}
                      <span className="absolute inset-x-0 bottom-0 p-2.5 text-white">
                        <span className="block truncate font-bold leading-tight">{liker.name}, {liker.age}</span>
                        {liker.location && <span className="block truncate text-sm text-white/85">{liker.location}</span>}
                      </span>
                    </button>
                    <div className="likes-actions">
                      <button type="button" className="likes-action" onClick={() => handlePass(liker.id)} aria-label={`Pass on ${liker.name}`}>
                        Pass
                      </button>
                      <button type="button" className="likes-action" data-main="true" onClick={() => handleConnect(liker.id)} aria-label={`Connect with ${liker.name}`}>
                        <Heart className="hidden fill-current min-[360px]:block" aria-hidden="true" /> Connect
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="your-likes" className="mt-4">
            {sentLoading ? (
              <div className="grid grid-cols-2 gap-3" aria-busy="true" aria-label="Loading">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="overflow-hidden rounded-[20px] border-2 border-border">
                    <Skeleton className="aspect-[3/4] w-full rounded-none" />
                    <Skeleton className="h-12 w-full rounded-none" />
                  </div>
                ))}
              </div>
            ) : sentError ? (
              <BrandedEmptyState
                mascot="confused"
                headline="We couldn't load your Connects."
                description="Check your connection and try again."
                ctaLabel="Try again"
                onCtaClick={() => fetchSentLikes(true)}
                className="py-4"
              />
            ) : sentLikes.length === 0 ? (
              <BrandedEmptyState
                mascot="heart"
                headline="No Connects yet"
                description="People you Connect with show up here until they answer."
                ctaLabel="Go to Discover"
                onCtaClick={() => navigate("/")}
                className="py-3"
              />
            ) : (
              <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {sentLikes.map((profile, idx) => (
                  <li key={profile.id} className={cn("kit-card likes-card", !reducedMotion && "kit-rise")} style={{ "--i": Math.min(idx, 8) } as CSSProperties}>
                    <button type="button" className="likes-photo block w-full text-left" onClick={() => openProfileDetail(profile.id)} aria-label={`View ${profile.name}'s profile`}>
                      {profile.profile_image ? (
                        <BlurImage src={profile.profile_image} alt="" className="absolute inset-0 h-full w-full" loading="lazy" sizes="(max-width: 375px) 170px, 200px" />
                      ) : (
                        <span className="absolute inset-0 grid place-items-center text-4xl font-extrabold text-muted-foreground">{profile.name?.[0] || "?"}</span>
                      )}
                      <span className="likes-photo-shade" />
                      <span className="absolute inset-x-0 bottom-0 p-2.5 text-white">
                        <span className="block truncate font-bold leading-tight">{profile.name}, {profile.age}</span>
                        {profile.location && (
                          <span className="flex items-center gap-1 truncate text-sm text-white/85"><MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{profile.location}</span>
                        )}
                      </span>
                    </button>
                    <div className="likes-actions">
                      <span className="likes-action !flex-[1_1_0] !font-semibold" aria-label={profile.swiped_at ? `Connected ${formatRelativeTime(profile.swiped_at)} ago` : undefined}>
                        {profile.swiped_at ? formatRelativeTime(profile.swiped_at) : "Sent"}
                      </span>
                      <button type="button" className="likes-action" onClick={() => setUnlikeTarget(profile)} aria-label={`Remove your Connect with ${profile.name}`}>
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Confirm before removing a Connect */}
      <AlertDialog open={!!unlikeTarget} onOpenChange={(open) => { if (!open) setUnlikeTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove your Connect?</AlertDialogTitle>
            <AlertDialogDescription>
              They won't know you were interested. You can always Connect again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!unlikeTarget) return;
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                await supabase.from("swipes").delete().eq("swiper_id", user.id).eq("swiped_id", unlikeTarget.id).eq("direction", "right");
                setSentLikes(prev => prev.filter(p => p.id !== unlikeTarget.id));
                setUnlikeTarget(null);
                triggerDiscoveryRefresh();
                toast({ title: "Connect removed", description: "They'll show up in Discover again." });
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Profile Detail Sheet */}
      <ProfileDetailSheet
        profile={detailProfile}
        onClose={() => setDetailProfile(null)}
        onConnect={(id) => { handleConnect(id); setDetailProfile(null); }}
        onPass={(id) => { handlePass(id); setDetailProfile(null); }}
      />

      {saidYes && (
        <MatchModal
          isOpen
          onClose={() => setSaidYes(null)}
          matchedUser={{ name: saidYes.profile.name, profile_image: saidYes.profile.profile_image }}
          onSendMessage={() => navigate(saidYes.matchId ? `/chat/${saidYes.matchId}` : "/messages")}
        />
      )}

      <BottomNav />
      {showLikesTour && (
        <SpotlightTour
          tourKey="likes_tour"
          steps={likesTourSteps}
          onComplete={() => { setShowLikesTour(false); markLikesTourSeen(); }}
        />
      )}
    </div>
  );
};

export default LikesYou;
