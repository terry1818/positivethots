import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MicroCelebration } from "@/components/onboarding/MicroCelebration";
import { Lock, Heart, Crown, Check, X, Star, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LikerProfile {
  id: string; name: string; age: number; profile_image?: string; location?: string; bio?: string;
  is_super_like?: boolean;
}

interface SentLikeProfile {
  id: string; name: string; age: number; profile_image?: string; location?: string; swiped_at?: string;
}

const LikesYou = () => {
  const navigate = useNavigate();
  const [isPremium, setIsPremium] = useState(false);
  const [likers, setLikers] = useState<LikerProfile[]>([]);
  const [likerCount, setLikerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);

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
        <div className="container max-w-md mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Likes</h1>
            {likerCount > 0 && (
              <span className="bg-primary text-primary-foreground text-sm px-2 py-0.5 rounded-full animate-pulse">{likerCount}</span>
            )}
          </div>

          <Tabs defaultValue="likes-you" onValueChange={handleTabChange}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="likes-you" className="flex-1">Likes You</TabsTrigger>
              <TabsTrigger value="your-likes" className="flex-1">Your Likes</TabsTrigger>
            </TabsList>

            <TabsContent value="likes-you">
              {loading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-52 rounded-xl" />)}
                </div>
              ) : likerCount === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="animate-bounce-in">
                    <Heart className="h-12 w-12 mx-auto mb-3 opacity-30 animate-pulse" />
                  </div>
                  <p className="text-lg font-medium">No likes yet</p>
                  <p className="text-sm mb-6">Keep swiping — they'll show up here!</p>
                  {!isPremium && (
                    <Card className="animate-pulse-border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 text-left">
                      <CardContent className="p-4 text-center">
                        <Crown className="h-8 w-8 text-primary mx-auto mb-2 animate-wiggle" />
                        <p className="font-semibold text-foreground mb-1">Unlock Premium</p>
                        <p className="text-sm text-muted-foreground mb-3">See who likes you instantly — $9.99/mo.</p>
                        <Button onClick={() => navigate("/premium")} className="w-full">
                          <Lock className="h-4 w-4 mr-2" />Go Premium
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : !isPremium ? (
                <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 animate-pulse-border">
                  <CardContent className="p-4 text-center">
                    <Crown className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-semibold mb-1">{likerCount} {likerCount === 1 ? "person" : "people"} liked you</p>
                    <p className="text-sm text-muted-foreground mb-3">Upgrade to Premium to see who they are</p>
                    <Button onClick={() => navigate("/premium")} className="w-full">
                      <Lock className="h-4 w-4 mr-2" />Unlock Premium — $9.99/mo
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {likers.map((liker, idx) => (
                    <Card key={liker.id} className={cn("overflow-hidden relative animate-stagger-fade", liker.is_super_like && "ring-2 ring-amber-500/50")} style={{ animationDelay: `${idx * 80}ms` }}>
                      {liker.is_super_like && (
                        <Badge className="absolute top-2 right-2 z-10 bg-amber-500 text-white">
                          <Star className="h-3 w-3 mr-1 fill-current" />Thot
                        </Badge>
                      )}
                      <div className="relative h-44 bg-gradient-to-br from-primary/20 to-secondary/20">
                        {liker.profile_image ? (
                          <BlurImage src={liker.profile_image} alt={liker.name} className="absolute inset-0 w-full h-full" loading="lazy" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Heart className="h-10 w-10 text-primary/30" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="text-white font-semibold text-sm">{liker.name}, {liker.age}</p>
                          {liker.location && <p className="text-white/80 text-xs">{liker.location}</p>}
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
                    <Card key={profile.id} className="overflow-hidden relative animate-stagger-fade" style={{ animationDelay: `${idx * 80}ms` }}>
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
                          {profile.location && (
                            <p className="text-white/80 text-xs flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />{profile.location}
                            </p>
                          )}
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
      <BottomNav />
    </div>
  );
};

export default LikesYou;
