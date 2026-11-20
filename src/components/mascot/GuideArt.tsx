import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LazyMotion, domAnimation, m } from "motion/react";
import { useAuth } from "@/contexts/AuthContext";
import { guideChoices, guideManifest, localGuideDate, selectGuide, type GuideName } from "@/lib/guideRotation";
import { guideFileUrl } from "@/lib/guideAssets";
import { useGuideInteraction } from "@/hooks/useGuideInteraction";
import { useSoundEffects } from "@/hooks/useSoundEffects";
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
/** `source` shows one specific picture (a lesson illustration) with the same motion and touch behaviour as a guide. */
export function GuideArt({ name, size, className = "", alt = "", animate = true, secondary = false, interactive = true, source }: { name: GuideName; size: number; className?: string; alt?: string; animate?: boolean; secondary?: boolean; interactive?: boolean; source?: { src: string; width: number; height: number } }) {
  const { user, loading: authLoading } = useAuth();
  const day = sessionDay;
  const { ref, running, visible } = usePathAnimation<HTMLSpanElement>();
  const reduced = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
  const { playNodeTap } = useSoundEffects();
  // Stickers answer the pointer unless they are tiny accents, static, or motion is reduced.
  const fx = useGuideInteraction(interactive && animate && !reduced && size >= 48, visible, playNodeTap);
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
  // Keep the speech bubble inside the screen when the sticker sits near an edge.
  const bubble = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = bubble.current; const hostEl = fx.host.current; if (!el || !hostEl) return;
    const rect = hostEl.getBoundingClientRect(); const half = el.offsetWidth / 2; const center = rect.left + rect.width / 2;
    const shift = center - half < 8 ? 8 - (center - half) : center + half > window.innerWidth - 8 ? window.innerWidth - 8 - (center + half) : 0;
    el.style.setProperty("--bubble-shift", `${shift.toFixed(0)}px`);
  }, [fx.hover, fx.line, fx.host]);
  // A tap flips to the next version of this pose when alternates exist.
  const choices = source ? [] : guideChoices(name);
  const file = source ? source.src : choices[(Math.max(0, choices.indexOf(selectGuide(name, user?.id, day))) + fx.flip) % choices.length];
  const [width, height] = source ? [source.width, source.height] : guideManifest[file];
  const src = source ? source.src : guideFileUrl(file);
  if (plainScreens.test(window.location.pathname)) return null;
  return <LazyMotion features={domAnimation} strict><m.span ref={ref} className={`guide-art ${className}`} style={{ height: size, width: size * width / height, maxWidth: "100%", aspectRatio: `${width}/${height}` }}
    initial={animate ? reduced ? { opacity: 0 } : { opacity: 0, scale: .8 } : false} animate={{ opacity: 1, scale: 1 }} transition={reduced ? { duration: .1 } : { type: "spring", ...spring.pop }}>
    {loaded && <span ref={fx.host} className={fx.classes} style={{ "--guide-mask": `url(${src})` } as React.CSSProperties} {...fx.handlers}>
      <span className="guide-pop">
        <img key={file} src={src} width={width} height={height} loading="lazy" decoding="async" alt={alt} data-guide={source ? "lesson-art" : name} draggable={false}
          className={animate && !reduced && running ? "guide-art-image guide-floating guide-breathe" : "guide-art-image"}/>
        <span className="guide-gloss" aria-hidden="true"/>
      </span>
      {fx.hover && fx.line && size >= 96 && <span ref={bubble} className="guide-bubble" aria-hidden="true">{fx.line}</span>}
      {fx.burst > 0 && <span key={fx.burst} className="guide-burst" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ "--a": `${i * 45}deg` } as React.CSSProperties}/>)}</span>}
    </span>}
  </m.span></LazyMotion>;
}