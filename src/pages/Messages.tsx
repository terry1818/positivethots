import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BottomNav } from "@/components/BottomNav";
import { MessageCircle, ChevronLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Match {
  id: string;
  profile: {
    id: string;
    name: string;
    profile_image: string;
    age: number;
  };
}

const Messages = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadMatches();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) navigate("/auth");
  };

  const loadMatches = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: matchesData, error } = await supabase
        .from("matches")
        .select("id, user1_id, user2_id, created_at")
        .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const matchesWithProfiles = await Promise.all(
        matchesData.map(async (match) => {
          const otherId = match.user1_id === session.user.id ? match.user2_id : match.user1_id;
          const { data: profile } = await supabase
            .from("profiles").select("id, name, profile_image, age").eq("id", otherId).single();
          return {
            id: match.id,
            profile: profile || {
              id: otherId, name: "Unknown",
              profile_image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherId}`, age: 0,
            },
          };
        })
      );

      setMatches(matchesWithProfiles);
    } catch (error: any) {
      console.error("Error loading matches:", error);
      toast.error("Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-muted-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Logo size="md" />
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-1 container max-w-md mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-8">
            <div className="animate-bounce-in">
              <MessageCircle className="h-24 w-24 text-muted-foreground mb-6 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold mb-3">No Matches Yet</h2>
            <p className="text-muted-foreground mb-6">Start swiping to find your matches!</p>
            <Button onClick={() => navigate("/")} className="bg-gradient-to-r from-primary to-secondary">
              Start Swiping
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match, idx) => (
              <Card
                key={match.id}
                className="p-4 cursor-pointer hover:bg-accent/50 transition-all duration-200 hover:-translate-y-0.5 animate-stagger-fade"
                style={{ animationDelay: `${idx * 60}ms` }}
                onClick={() => navigate(`/chat/${match.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={match.profile.profile_image} alt={match.profile.name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                    {/* Simulated online dot */}
                    {idx < 2 && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success rounded-full border-2 border-card animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{match.profile.name}, {match.profile.age}</h3>
                    <p className="text-sm text-muted-foreground">Tap to start chatting</p>
                  </div>
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Messages;
