import { useEffect, useState } from "react";
import { LazyMotion, domAnimation, m } from "motion/react";
import { useAuth } from "@/contexts/AuthContext";
import { guideManifest, localGuideDate, selectGuide, type GuideName } from "@/lib/guideRotation";
import { guideUrl } from "@/lib/guideAssets";
import { usePathAnimation } from "@/hooks/usePathAnimation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { spring } from "@/lib/motionTokens";

export type { GuideName } from "@/lib/guideRotation";
export function tierGuide(tier: string | null): GuideName {
  const names: Record<string, GuideName> = { foundation: "guide-tier-foundation", sexual_health: "guide-tier-sexual-health", identity: "guide-tier-identity", relationships: "guide-tier-relationships", advanced: "guide-tier-advanced" };
  return names[tier || "foundation"] || "guide-tier-foundation";
}
const firstLoads = new Map<string, HTMLSpanElement>();
const releasedPages = new Set<string>();
const sessionDay = localGuideDate();
const plainScreens = /^\/(settings|admin|complaints|appeals|contact|privacy(?:-policy)?|terms|community-guidelines|unsubscribe|verification|report|safety|moderation)(?:\/|$)/;
export function GuideArt({ name, size, className = "", alt = "", animate = true, secondary = false }: { name: GuideName; size: number; className?: string; alt?: string; animate?: boolean; secondary?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const day = sessionDay;
  const { ref, running, visible } = usePathAnimation<HTMLSpanElement>();
  const reduced = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const load = () => {
      if (!visible || authLoading) return;
      const page = window.location.pathname;
      const owner = firstLoads.get(page);
      if (owner && !owner.isConnected) firstLoads.delete(page);
      if (!releasedPages.has(page) && (secondary || firstLoads.has(page) && firstLoads.get(page) !== ref.current)) return;
      if (!firstLoads.has(page) && ref.current) firstLoads.set(page, ref.current);
      setLoaded(true);
    };
    const release = () => { releasedPages.add(window.location.pathname); load(); };
    load();
    // After the first paint, a second contextual image may enter without a gesture.
    const timer = window.setTimeout(() => {
      const inView = Array.from(document.querySelectorAll<HTMLImageElement>("img[data-guide]")).filter(image => {
        const rect = image.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight && image.offsetParent !== null;
      });
      if (inView.length < 2 || ref.current?.closest('[role="dialog"]')) release();
    }, 1000);
    for (const event of ["wheel", "touchstart", "pointerdown", "keydown", "scroll"]) window.addEventListener(event, release, { passive: true });
    return () => { window.clearTimeout(timer); for (const event of ["wheel", "touchstart", "pointerdown", "keydown", "scroll"]) window.removeEventListener(event, release); };
  }, [visible, name, authLoading, secondary, ref]);
  const [width, height] = guideManifest[selectGuide(name, user?.id, day)];
  if (plainScreens.test(window.location.pathname)) return null;
  return <LazyMotion features={domAnimation} strict><m.span ref={ref} className={`guide-art ${className}`} style={{ height: size, width: size * width / height, maxWidth: "100%", aspectRatio: `${width}/${height}` }}
    initial={animate ? reduced ? { opacity: 0 } : { opacity: 0, scale: .8 } : false} animate={{ opacity: 1, scale: 1 }} transition={reduced ? { duration: .1 } : { type: "spring", ...spring.pop }}>
    {loaded && <img src={guideUrl(name, user?.id, day)} width={width} height={height} loading="lazy" decoding="async" alt={alt} data-guide={name}
      className={animate && !reduced && running ? "guide-art-image guide-floating" : "guide-art-image"}/>}
  </m.span></LazyMotion>;
}