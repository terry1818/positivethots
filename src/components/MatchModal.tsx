import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
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
  isFirstMatch?: boolean;
}

const confettiEmojis = ["💜", "💕", "✨", "🔥", "💫", "❤️", "🌟", "💖"];

export const MatchModal = ({ isOpen, onClose, matchedProfile, matchedUser, onSendMessage, isFirstMatch = false }: MatchModalProps) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const user = matchedUser || matchedProfile;
  const [confetti, setConfetti] = useState<{ id: number; emoji: string; x: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (!prefersReducedMotion) {
        const particles = Array.from({ length: 16 }, (_, i) => ({
          id: i,
          emoji: confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)],
          x: 5 + Math.random() * 90,
          delay: Math.random() * 1,
          duration: 2 + Math.random() * 1.5,
        }));
        setConfetti(particles);
        if (navigator.vibrate) {
          navigator.vibrate([50, 50, 100]);
        }
      } else {
        setConfetti([]);
      }
    } else {
      setConfetti([]);
    }
  }, [isOpen, prefersReducedMotion]);

  if (!user) return null;

  const imageUrl = user.profile_image || (user as any).image || "/placeholder.svg";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-br from-primary to-secondary p-0 overflow-hidden" aria-live="assertive" aria-label={`Match celebration: You and ${user.name} connected`}>
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
            <div className="mb-6">
              <Heart className="h-20 w-20 mx-auto text-white fill-current mb-4 animate-bounce-in" />
              <h2 className="text-4xl font-bold text-white mb-2 animate-fade-in" style={{ animationDelay: "0.15s", animationFillMode: "both" }}>You Both Said Yes</h2>
              <p className="text-white/90 text-lg animate-fade-in" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
                You and {user.name} connected 💜
              </p>
            </div>

            <div className="flex justify-center mb-6">
              <div className="animate-match-slide-right">
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

              {/* First-match safety prompt */}
              {isFirstMatch && (
                <div className="mt-3 bg-white/10 rounded-lg p-3 text-left">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-white mt-0.5 shrink-0" />
                    <div>
                      <p className="text-white/90 text-xs">
                        Meeting someone new? Check out our safety tips before your first date.
                      </p>
                      <button
                        className="text-white underline text-xs mt-1 hover:text-white/80"
                        onClick={() => { onClose(); navigate("/privacy-policy"); }}
                      >
                        View Safety Tips →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
