import { useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Lock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface MysteryProfile {
  id: string;
  name: string;
  age: number;
  profile_image: string | null;
  photos: string[] | null;
  compatibility_score?: number;
  [key: string]: any;
}

interface MysteryMatchCardProps {
  profile: MysteryProfile;
  /** The member has a reveal left today (or a bonus reveal from the daily spin). */
  canReveal: boolean;
  /** Spends a reveal. Resolves true when it was spent. */
  onReveal: () => Promise<boolean>;
  /** Called once the photo has come into focus: the page then shows the ordinary card for this person. */
  onRevealed: (id: string) => void;
  onPass: (id: string) => void;
  /** No reveal left: explain how to get more. */
  onUpgrade: () => void;
}

/**
 * A high-compatibility person shown blurred until the member spends a reveal. It sits in the same
 * slot as an ordinary card and has the same dock under it, so Pass is always one tap away and a
 * member with no reveals left is never stuck on it.
 */
export const MysteryMatchCard = memo(({ profile, canReveal, onReveal, onRevealed, onPass, onUpgrade }: MysteryMatchCardProps) => {
  const [revealing, setRevealing] = useState(false);
  const { playBadgeUnlock } = useSoundEffects();

  const imageUrl = profile.profile_image || profile.photos?.[0] || "/placeholder.svg";
  const compatibility = profile.compatibility_score || 0;

  const handleReveal = useCallback(async () => {
    if (revealing) return;
    if (!canReveal) {
      onUpgrade();
      return;
    }
    setRevealing(true);
    const spent = await onReveal();
    if (!spent) {
      setRevealing(false);
      return;
    }
    playBadgeUnlock();
    // Let the blur clear, then hand over to the ordinary card.
    setTimeout(() => onRevealed(profile.id), 800);
  }, [revealing, canReveal, onReveal, onRevealed, onUpgrade, playBadgeUnlock, profile.id]);

  return (
    <>
      <div className="discover-card-slot" style={{ zIndex: 30 }} data-walkthrough="discovery-card" data-tour="discovery-card">
        <article className="kit-card discover-card" aria-label="Mystery Match">
          <div className="discover-photo">
            <img
              src={imageUrl}
              alt=""
              className={cn("absolute inset-0 h-full w-full object-cover", "transition-[filter,transform] duration-700 ease-out motion-reduce:transition-none")}
              style={revealing ? { filter: "blur(0px)", transform: "scale(1)" } : { filter: "blur(22px)", transform: "scale(1.15)" }}
              decoding="async"
            />
            <div className="absolute inset-0 bg-black/45" style={{ opacity: revealing ? 0 : 1, transition: "opacity .7s ease-out" }} />

            {!revealing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
                <span className="kit-coin kit-coin-lg kit-coin-round kit-pop" data-tone="reward"><Sparkles aria-hidden="true" /></span>
                <h2 className="text-2xl font-extrabold leading-tight">Mystery Match</h2>
                {compatibility > 0 && <span className="kit-chip" data-tone="area">{compatibility}% Compatible</span>}
                <p className="max-w-[16rem] text-sm text-white/90 [text-wrap:balance]">
                  {canReveal
                    ? "Someone you have a lot in common with. Reveal them to see who it is."
                    : "You've used today's reveals. Pass for now, or get more."}
                </p>
                <Button className="kit-cta mt-1 w-full max-w-[16rem] gap-2" onClick={handleReveal}>
                  {canReveal ? <Eye className="h-5 w-5" aria-hidden="true" /> : <Lock className="h-5 w-5" aria-hidden="true" />}
                  {canReveal ? "Reveal" : "Get more reveals"}
                </Button>
              </div>
            )}
          </div>
        </article>
      </div>

      <div className="discover-dock" data-walkthrough="action-buttons" data-tour="action-buttons">
        <div className="discover-dock-item">
          <button type="button" className="kit-action" data-tone="quiet" onClick={() => onPass(profile.id)} aria-label="Pass on this Mystery Match" disabled={revealing}>
            <X aria-hidden="true" />
          </button>
          <span aria-hidden="true">Pass</span>
        </div>
      </div>
    </>
  );
}, (prev, next) => prev.profile.id === next.profile.id && prev.canReveal === next.canReveal);

MysteryMatchCard.displayName = "MysteryMatchCard";
