import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { GuideArt, type GuideName } from "@/components/mascot/GuideArt";
import { useAuth } from "@/contexts/AuthContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { guideUrl } from "@/lib/guideAssets";
import { spring } from "@/lib/motionTokens";

/** The cheering poses, in the order they take the stage. */
const cast: GuideName[] = ["guide-thumbs-up", "guide-high-five", "guide-celebrate-all", "guide-level-up", "guide-trophy"];

/**
 * A different character pops in every couple of seconds on the lesson-complete screen.
 * `start` moves the opening pose along, so back-to-back lessons do not open the same way.
 * With reduced motion one pose is shown and nothing cycles.
 */
export function CelebrationCast({ start = 0, size = 184 }: { start?: number; size?: number }) {
  const reduced = useReducedMotion();
  const [turn, setTurn] = useState(0);
  const { user } = useAuth();
  const name = cast[(start + turn) % cast.length];
  useEffect(() => {
    // Fetch the next poses ahead of time so each swap is instant.
    for (const pose of cast) new Image().src = guideUrl(pose, user?.id);
  }, [user?.id]);
  useEffect(() => {
    if (reduced) return;
    const timer = window.setInterval(() => { if (!document.hidden) setTurn(value => value + 1); }, 2200);
    return () => window.clearInterval(timer);
  }, [reduced]);
  return <div className="celebration-cast" style={{ height: size }}>
    <AnimatePresence mode="wait" initial={false}>
      <m.div key={name} className="celebration-cast-pose" initial={reduced ? false : { opacity: 0, scale: 0.55, rotate: -10, y: 24 }} animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
        exit={reduced ? undefined : { opacity: 0, scale: 0.8, y: -16, transition: { duration: 0.16 } }} transition={reduced ? { duration: 0.1 } : { type: "spring", ...spring.pop }}>
        <GuideArt name={name} size={size} alt="Guides celebrating your finished lesson" />
      </m.div>
    </AnimatePresence>
  </div>;
}
