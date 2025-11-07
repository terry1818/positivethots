import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SwipeCard } from "@/components/SwipeCard";
import { MatchModal } from "@/components/MatchModal";
import { Flame, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Profile {
  id: string;
  name: string;
  age: number;
  bio: string;
  profile_image: string;
  location: string;
}

const Index = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchModal, setMatchModal] = useState<{
    isOpen: boolean;
    profile: { id: string; name: string; image: string } | null;
    matchId: string | null;
  }>({ isOpen: false, profile: null, matchId: null });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoadProfiles();
  }, []);

  const checkAuthAndLoadProfiles = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setCurrentUserId(session.user.id);
    await loadProfiles(session.user.id);
  };

  const loadProfiles = async (userId: string) => {
    try {
      // Get profiles that user hasn't swiped on yet
      const { data: swipedIds } = await supabase
        .from("swipes")
        .select("swiped_id")
        .eq("swiper_id", userId);

      const excludeIds = swipedIds?.map((s) => s.swiped_id) || [];
      excludeIds.push(userId); // Don't show own profile

      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (excludeIds.length > 0) {
        query = query.not("id", "in", `(${excludeIds.join(",")})`);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error("Error loading profiles:", error);
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: "left" | "right") => {
    if (!currentUserId) return;

    const currentProfile = profiles[currentIndex];

    try {
      // Record the swipe
      const { error: swipeError } = await supabase.from("swipes").insert({
        swiper_id: currentUserId,
        swiped_id: currentProfile.id,
        direction,
      });

      if (swipeError) throw swipeError;

      if (direction === "right") {
        // Check if it's a match
        const { data: matchId, error: matchError } = await supabase.rpc(
          "check_match",
          {
            user1: currentUserId,
            user2: currentProfile.id,
          }
        );

        if (matchError) {
          console.error("Match check error:", matchError);
        }

        if (matchId) {
          setMatchModal({
            isOpen: true,
            profile: {
              id: currentProfile.id,
              name: currentProfile.name,
              image: currentProfile.profile_image,
            },
            matchId: matchId,
          });
        } else {
          toast.success(`You liked ${currentProfile.name}!`);
        }
      } else {
        toast(`Passed on ${currentProfile.name}`);
      }

      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 300);
    } catch (error: any) {
      console.error("Error handling swipe:", error);
      toast.error("Failed to record swipe");
    }
  };

  const remainingProfiles = profiles.slice(currentIndex);

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
        <div className="container max-w-md mx-auto px-4 py-4 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Flame className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SwipeMatch
            </h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container max-w-md mx-auto px-4 py-6 flex flex-col">
        {remainingProfiles.length > 0 ? (
          <div className="relative flex-1 max-h-[calc(100vh-250px)]">
            {remainingProfiles.slice(0, 3).map((profile, index) => (
              <SwipeCard
                key={profile.id}
                profile={{
                  id: parseInt(profile.id.substring(0, 8), 16),
                  name: profile.name,
                  age: profile.age,
                  bio: profile.bio || "",
                  image: profile.profile_image,
                  location: profile.location,
                }}
                onSwipe={handleSwipe}
                isTop={index === 0}
              />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center px-8">
            <div className="animate-fade-in">
              <Flame className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
              <h2 className="text-3xl font-bold mb-3">That's everyone!</h2>
              <p className="text-muted-foreground text-lg">
                Check back later for more people nearby
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="border-t border-border bg-card">
        <div className="container max-w-md mx-auto px-4 py-3 flex justify-around">
          <Button variant="ghost" size="icon" className="text-primary">
            <Flame className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            onClick={() => navigate("/messages")}
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            onClick={() => navigate("/profile")}
          >
            <User className="h-6 w-6" />
          </Button>
        </div>
      </nav>

      {/* Match Modal */}
      <MatchModal
        isOpen={matchModal.isOpen}
        onClose={() => setMatchModal({ isOpen: false, profile: null, matchId: null })}
        matchedProfile={matchModal.profile}
        onSendMessage={() => {
          if (matchModal.matchId) {
            navigate(`/chat/${matchModal.matchId}`);
          }
        }}
      />
    </div>
  );
};

export default Index;
