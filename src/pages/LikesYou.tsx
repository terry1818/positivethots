import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MicroCelebration } from "@/components/onboarding/MicroCelebration";
import { Lock, Heart, Crown, Check, X, Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LikerProfile {
  id: string; name: string; age: number; profile_image?: string; location?: string; bio?: string;
  is_super_like?: boolean;
}

const LikesYou = () => {
  const navigate = useNavigate();
  const { isPremium, loading: subLoading } = useSubscription();
  const [likers, setLikers] = useState<LikerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);

  useEffect(() => {
    const fetchLikers = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data: swipes } = await supabase.from("swipes").select("swiper_id").eq("swiped_id", user.id).eq("direction", "right");
      if (!swipes || swipes.length === 0) { setLikers([]); setLoading(false); return; }

      const { data: matches } = await supabase.from("matches").select("user1_id, user2_id").or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
      const matchedIds = new Set((matches || []).flatMap(m => [m.user1_id, m.user2_id].filter(id => id !== user.id)));
      const likerIds = swipes.map(s => s.swiper_id).filter(id => !matchedIds.has(id));

      if (likerIds.length === 0) { setLikers([]); setLoading(false); return; }

      const likerProfiles: LikerProfile[] = [];
      for (const likerId of likerIds) {
        const { data } = await supabase.rpc("get_public_profile", { _user_id: likerId });
        if (data?.[0]) likerProfiles.push(data[0] as LikerProfile);
      }
      setLikers(likerProfiles);
      setLoading(false);
    };
    fetchLikers();
  }, [navigate]);

  const handleConnect = async (likerId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("swipes").insert({ swiper_id: user.id, swiped_id: likerId, direction: "right" });
    const { data: matchId } = await supabase.rpc("check_match", { user1: user.id, user2: likerId });
    if (matchId) {
      setCelebrationTrigger(prev => prev + 1);
      toast({ title: "It's a match! 🎉", description: "You can now start chatting." });
      setLikers(prev => prev.filter(l => l.id !== likerId));
    }
  };

  const handlePass = async (likerId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("swipes").insert({ swiper_id: user.id, swiped_id: likerId, direction: "left" });
    setLikers(prev => prev.filter(l => l.id !== likerId));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MicroCelebration trigger={celebrationTrigger} emojis={["🎉", "💕", "✨", "💜"]} />
      <div className="flex-1 overflow-auto">
        <div className="container max-w-md mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Likes You</h1>
            {likers.length > 0 && (
              <span className="bg-primary text-primary-foreground text-sm px-2 py-0.5 rounded-full animate-pulse">{likers.length}</span>
            )}
          </div>

          {loading || subLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-52 rounded-xl" />)}
            </div>
          ) : likers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <div className="animate-bounce-in">
                <Heart className="h-12 w-12 mx-auto mb-3 opacity-30 animate-pulse" />
              </div>
              <p className="text-lg font-medium">No likes yet</p>
              <p className="text-sm mb-6">Keep swiping — they'll show up here!</p>
              {!isPremium && !subLoading && (
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
          ) : (
            <>
              {!isPremium && (
                <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 animate-pulse-border">
                  <CardContent className="p-4 text-center">
                    <Crown className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-semibold mb-1">{likers.length} {likers.length === 1 ? "person" : "people"} liked you</p>
                    <p className="text-sm text-muted-foreground mb-3">Upgrade to Premium to see who they are</p>
                    <Button onClick={() => navigate("/premium")} className="w-full">
                      <Lock className="h-4 w-4 mr-2" />Unlock Premium — $9.99/mo
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-3">
                {likers.map((liker, idx) => (
                  <Card key={liker.id} className="overflow-hidden relative animate-stagger-fade" style={{ animationDelay: `${idx * 80}ms` }}>
                    <div className="relative h-44 bg-gradient-to-br from-primary/20 to-secondary/20">
                      {liker.profile_image ? (
                        <img
                          src={liker.profile_image}
                          alt={isPremium ? liker.name : "Hidden"}
                          className={cn("absolute inset-0 w-full h-full object-cover", !isPremium && "animate-peek-unblur")}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Heart className={cn("h-10 w-10 text-primary/30", !isPremium && "blur-lg")} />
                        </div>
                      )}
                      {!isPremium && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Lock className="h-8 w-8 text-white/80" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className={cn("text-white font-semibold text-sm", !isPremium && "blur-md")}>{liker.name}, {liker.age}</p>
                        {liker.location && <p className={cn("text-white/80 text-xs", !isPremium && "blur-md")}>{liker.location}</p>}
                      </div>
                    </div>
                    {isPremium && (
                      <div className="flex">
                        <Button variant="ghost" size="sm" className="flex-1 rounded-none text-destructive hover:bg-destructive/10" onClick={() => handlePass(liker.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1 rounded-none text-primary hover:bg-primary/10" onClick={() => handleConnect(liker.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default LikesYou;
