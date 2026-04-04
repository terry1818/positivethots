import { useEffect, useState } from "react";
import { useTutorialState } from "@/hooks/useTutorialState";
import { SpotlightTour, type TourStep } from "@/components/SpotlightTour";
import { BlurImage } from "@/components/BlurImage";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { triggerDiscoveryRefresh } from "@/lib/discoveryEvents";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MicroCelebration } from "@/components/onboarding/MicroCelebration";
import { Lock, Heart, Crown, Check, X, Star, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { VerifiedBadgeOverlay } from "@/components/VerifiedBadgeOverlay";
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

const LikesYou = () => {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [isPremium, setIsPremium] = useState(false);
  const { seen: likesTourSeen, markSeen: markLikesTourSeen } = useTutorialState("likes_tour");
  const [showLikesTour, setShowLikesTour] = useState(false);

  const likesTourSteps: TourStep[] = [
    { target: "likes-tab-likes-you", title: "Who Likes You", description: "People who've Connected with you appear here. Upgrade to Premium to see who they are!", position: "below" },
    { target: "likes-tab-your-likes", title: "Your Connects", description: "See everyone you've Connected with. Remove a Connect if you change your mind.", position: "below" },
  ];
  const [likers, setLikers] = useState<LikerProfile[]>([]);
  const [likerCount, setLikerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);
  const [unlikeTarget, setUnlikeTarget] = useState<SentLikeProfile | null>(null);

  // Sent likes state
  const [sentLikes, setSentLikes] = useState<SentLikeProfile[]>([]);
  const [sentLoading, setSentLoading] = useState(false);
  const [sentFetched, setSentFetched] = useState(false);

  useEffect(() => {
    const fetchLikers = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data, error } = await supabase.rpc("get_likers_for_user", { _user_id: user.id });
      
      if (error) {
        console.error("Error fetching likers:", error);
        setLoading(false);
        return;
      }

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
        setLikers(profiles);
      } else {
        setLikers([]);
      }

      setLoading(false);
    };
    fetchLikers();
  }, [navigate]);

  // Show likes tour after loading
  useEffect(() => {
    if (!loading && !likesTourSeen) {
      setTimeout(() => setShowLikesTour(true), 600);
    }
  }, [loading, likesTourSeen]);

  const fetchSentLikes = async () => {
    if (sentFetched) return;
    setSentLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.rpc("get_sent_likes", { _user_id: user.id });
    if (error) {
      console.error("Error fetching sent likes:", error);
    } else if (data) {
      setSentLikes(data as SentLikeProfile[]);
    }
    setSentLoading(false);
    setSentFetched(true);
  };

  const handleConnect = async (likerId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("swipes").insert({ swiper_id: user.id, swiped_id: likerId, direction: "right" });
    const { data: matchId } = await supabase.rpc("check_match", { user1: user.id, user2: likerId });
    if (matchId) {
      setCelebrationTrigger(prev => prev + 1);
      toast({ title: "You Both Said Yes 💜", description: "You can now start chatting." });
      setLikers(prev => prev.filter(l => l.id !== likerId));
      setLikerCount(prev => Math.max(0, prev - 1));
    }
  };

  const handlePass = async (likerId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("swipes").insert({ swiper_id: user.id, swiped_id: likerId, direction: "left" });
    setLikers(prev => prev.filter(l => l.id !== likerId));
    setLikerCount(prev => Math.max(0, prev - 1));
  };

  const handleTabChange = (value: string) => {
    if (value === "your-likes") {
      fetchSentLikes();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <MicroCelebration trigger={celebrationTrigger} emojis={["🎉", "💕", "✨", "💜"]} />
      <div className="flex-1 overflow-auto">
        <div className="container max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4">
          <header className="border-b border-border bg-card py-3 flex items-center justify-between">
            <Logo size="md" showText={false} />
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">Likes</h1>
              {likerCount > 0 && (
                <span className="bg-primary text-primary-foreground text-sm px-2 py-0.5 rounded-full animate-pulse">{likerCount}</span>
              )}
            </div>
            <div className="w-10" />
          </header>

          <Tabs defaultValue="likes-you" onValueChange={handleTabChange}>
            <TabsList className="w-full mb-2 mt-2">
              <TabsTrigger value="likes-you" className="flex-1" data-tour="likes-tab-likes-you">Likes You</TabsTrigger>
              <TabsTrigger value="your-likes" className="flex-1" data-tour="likes-tab-your-likes">Your Likes</TabsTrigger>
            </TabsList>

            <TabsContent value="likes-you">
              {loading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="rounded-xl overflow-hidden border border-border">
                      <Skeleton className="h-44 w-full rounded-none" />
                      <div className="flex">
                        <Skeleton className="h-10 flex-1 rounded-none" />
                        <Skeleton className="h-10 flex-1 rounded-none" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : likerCount === 0 ? (
                <div className="space-y-2">
                  <BrandedEmptyState
                    mascot="heart"
                    headline="Your admirers are on their way! 💜"
                    description="Complete more badges to boost your profile visibility."
                    ctaLabel="Continue Learning"
                    onCtaClick={() => navigate("/learn")}
                    className="py-6 [&_.mb-6]:mb-3 [&_.mb-2]:mb-1"
                  />
                  {!isPremium && (
                    <Card className="animate-pulse-border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 text-left">
                      <CardContent className="p-2.5 text-center">
                        <Crown className="h-5 w-5 text-primary mx-auto mb-1 animate-wiggle" />
                        <p className="font-semibold text-foreground text-sm">Unlock Premium</p>
                        <p className="text-sm text-muted-foreground mb-2">See who likes you instantly — $9.99/mo.</p>
                        <Button onClick={() => navigate("/premium")} className="w-full" size="sm">
                          <Lock className="h-4 w-4 mr-2" />Go Premium
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : !isPremium ? (
                <div className="relative mb-6">
                  {/* Blurred placeholder cards */}
                  <div className="grid grid-cols-2 gap-3 blur-lg pointer-events-none select-none" aria-hidden="true">
                    {Array.from({ length: Math.min(4, likerCount) }).map((_, i) => (
                      <div key={i} className="rounded-xl overflow-hidden border border-border">
                        <div className="h-44 bg-gradient-to-br from-primary/30 to-secondary/30" />
                        <div className="flex h-10">
                          <div className="flex-1 bg-muted/50" />
                          <div className="flex-1 bg-muted/30" />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Overlay CTA */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl">
                    <Crown className="h-8 w-8 text-amber-500 mb-2" />
                    <p className="font-semibold text-base">{likerCount} {likerCount === 1 ? "person" : "people"} liked you</p>
                    <p className="text-sm text-muted-foreground mt-1">Upgrade to see who they are</p>
                    <Button
                      className="mt-4 bg-gradient-to-r from-primary to-pink-500 text-primary-foreground px-6"
                      onClick={() => navigate("/premium")}
                    >
                      See who likes you
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      <button onClick={() => navigate("/learn")} className="hover:underline">
                        Not ready to upgrade? Keep learning to unlock features →
                      </button>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {likers.map((liker, idx) => (
                    <Card key={liker.id} className={cn("overflow-hidden relative", !reducedMotion && "animate-stagger-fade", liker.is_super_like && "ring-2 ring-amber-500/50")} style={!reducedMotion ? { animationDelay: `${idx * 80}ms` } : undefined}>
                      {liker.is_super_like && (
                        <Badge className="absolute top-2 right-2 z-10 bg-amber-500 text-white">
                          <Star className="h-3 w-3 mr-1 fill-current" />Thot
                        </Badge>
                      )}
                      <div className="relative h-44 bg-gradient-to-br from-primary/20 to-secondary/20">
                        {liker.profile_image ? (
                          <BlurImage src={liker.profile_image} alt={liker.name} className="absolute inset-0 w-full h-full" loading="lazy" sizes="(max-width: 375px) 170px, 200px" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Heart className="h-10 w-10 text-primary/30" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="text-white font-semibold text-sm">{liker.name}, {liker.age}</p>
                          {liker.location && <p className="text-white/80 text-sm">{liker.location}</p>}
                        </div>
                      </div>
                      <div className="flex">
                        <Button variant="ghost" size="sm" className="flex-1 rounded-none text-destructive hover:bg-destructive/10" onClick={() => handlePass(liker.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1 rounded-none text-primary hover:bg-primary/10" onClick={() => handleConnect(liker.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="your-likes">
              {sentLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-52 rounded-xl" />)}
                </div>
              ) : sentLikes.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">No likes sent yet</p>
                  <p className="text-sm">Profiles you swipe right on will appear here.</p>
                </div>
              ) : (
              <div className="grid grid-cols-2 gap-3">
                  {sentLikes.map((profile, idx) => (
                    <Card
                      key={profile.id}
                      className={cn("overflow-hidden relative cursor-pointer", !reducedMotion && "animate-stagger-fade")}
                      style={!reducedMotion ? { animationDelay: `${idx * 80}ms` } : undefined}
                      onClick={() => navigate("/profile/" + profile.id)}
                    >
                      <button
                        className="absolute top-2 left-2 z-10 bg-destructive/80 rounded-full p-1.5 hover:bg-destructive transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUnlikeTarget(profile);
                        }}
                        aria-label="Unlike"
                      >
                        <X className="h-3.5 w-3.5 text-destructive-foreground" />
                      </button>
                      <div className="absolute top-2 right-2 z-10 bg-primary/80 rounded-full p-1.5">
                        <Heart className="h-3.5 w-3.5 text-primary-foreground fill-current" />
                      </div>
                      <div className="relative h-44 bg-gradient-to-br from-primary/20 to-secondary/20">
                        {profile.profile_image ? (
                          <img src={profile.profile_image} alt={profile.name} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Heart className="h-10 w-10 text-primary/30" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="text-white font-semibold text-sm">{profile.name}, {profile.age}</p>
                          <div className="flex items-center justify-between">
                            {profile.location && (
                              <p className="text-white/80 text-sm flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" />{profile.location}
                              </p>
                            )}
                            {profile.swiped_at && (
                              <span className="text-white/60 text-sm">
                                {formatRelativeTime(profile.swiped_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Unlike confirmation dialog */}
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
                toast({ title: "Removed from your likes", description: "They'll reappear in Discovery." });
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
