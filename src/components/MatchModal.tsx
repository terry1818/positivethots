import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface MatchedUser {
  name: string;
  profile_image?: string | null;
  image?: string;
}

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchedProfile?: MatchedUser | null;
  matchedUser?: MatchedUser | null;
  onSendMessage: () => void;
}

const confettiEmojis = ["💜", "💕", "✨", "🔥", "💫", "❤️", "🌟", "💖"];

export const MatchModal = ({ isOpen, onClose, matchedProfile, matchedUser, onSendMessage }: MatchModalProps) => {
  const user = matchedUser || matchedProfile;
  const [confetti, setConfetti] = useState<{ id: number; emoji: string; x: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    if (isOpen) {
      const particles = Array.from({ length: 16 }, (_, i) => ({
        id: i,
        emoji: confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)],
        x: 5 + Math.random() * 90,
        delay: Math.random() * 1,
        duration: 2 + Math.random() * 1.5,
      }));
      setConfetti(particles);
    } else {
      setConfetti([]);
    }
  }, [isOpen]);

  if (!user) return null;

  const imageUrl = user.profile_image || (user as any).image || "/placeholder.svg";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-br from-primary to-secondary p-0 overflow-hidden">
        {/* Confetti overlay */}
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          {confetti.map((p) => (
            <span
              key={p.id}
              className="absolute text-xl animate-confetti-heart"
              style={{
                left: `${p.x}%`,
                top: "-20px",
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              }}
            >
              {p.emoji}
            </span>
          ))}
        </div>

        <div className="relative p-8 text-center">
          {/* Animated hearts background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <Heart className="h-64 w-64 animate-pulse" />
          </div>

          <div className="relative z-10">
            <div className="mb-6 animate-bounce-in">
              <Heart className="h-20 w-20 mx-auto text-white fill-current mb-4 animate-pulse" />
              <h2 className="text-4xl font-bold text-white mb-2">You Both Said Yes</h2>
              <p className="text-white/90 text-lg">
                You and {user.name} connected 💜
              </p>
            </div>

            <div className="flex justify-center mb-6">
              <div className="relative animate-bounce-in" style={{ animationDelay: "0.2s" }}>
                <img
                  src={imageUrl}
                  alt={user.name}
                  className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-xl animate-glow-ring"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 animate-stagger-fade" style={{ animationDelay: "0.4s", animationFillMode: "both" }}>
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-semibold"
                onClick={() => {
                  onClose();
                  onSendMessage();
                }}
              >
                Send Message
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={onClose}
              >
                Keep Browsing
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
