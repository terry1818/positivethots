import { useState } from "react";
import { SwipeCard } from "@/components/SwipeCard";
import { MatchModal } from "@/components/MatchModal";
import { mockProfiles } from "@/data/mockProfiles";
import { Flame, MessageCircle, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Index = () => {
  const [profiles, setProfiles] = useState(mockProfiles);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchModal, setMatchModal] = useState<{
    isOpen: boolean;
    profile: { name: string; image: string } | null;
  }>({ isOpen: false, profile: null });

  const handleSwipe = (direction: "left" | "right") => {
    const currentProfile = profiles[currentIndex];

    if (direction === "right") {
      // Simulate match (30% chance)
      const isMatch = Math.random() > 0.7;
      if (isMatch) {
        setMatchModal({
          isOpen: true,
          profile: {
            name: currentProfile.name,
            image: currentProfile.image,
          },
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
  };

  const remainingProfiles = profiles.slice(currentIndex);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <User className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2">
            <Flame className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SwipeMatch
            </h1>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Settings className="h-6 w-6" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container max-w-md mx-auto px-4 py-6 flex flex-col">
        {remainingProfiles.length > 0 ? (
          <div className="relative flex-1 max-h-[calc(100vh-250px)]">
            {remainingProfiles.slice(0, 3).map((profile, index) => (
              <SwipeCard
                key={profile.id}
                profile={profile}
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
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MessageCircle className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <User className="h-6 w-6" />
          </Button>
        </div>
      </nav>

      {/* Match Modal */}
      <MatchModal
        isOpen={matchModal.isOpen}
        onClose={() => setMatchModal({ isOpen: false, profile: null })}
        matchedProfile={matchModal.profile}
      />
    </div>
  );
};

export default Index;
