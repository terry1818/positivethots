import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchedProfile: {
    name: string;
    image: string;
  } | null;
}

export const MatchModal = ({ isOpen, onClose, matchedProfile }: MatchModalProps) => {
  if (!matchedProfile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-br from-primary to-secondary p-0 overflow-hidden">
        <div className="relative p-8 text-center">
          {/* Animated hearts background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <Heart className="h-64 w-64 animate-pulse" />
          </div>

          <div className="relative z-10">
            <div className="mb-6 animate-fade-in">
              <Heart className="h-20 w-20 mx-auto text-white fill-current mb-4 animate-pulse" />
              <h2 className="text-4xl font-bold text-white mb-2">It's a Match!</h2>
              <p className="text-white/90 text-lg">
                You and {matchedProfile.name} liked each other
              </p>
            </div>

            <div className="flex justify-center mb-6">
              <div className="relative">
                <img
                  src={matchedProfile.image}
                  alt={matchedProfile.name}
                  className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-xl"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-semibold"
                onClick={onClose}
              >
                Send Message
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={onClose}
              >
                Keep Swiping
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
