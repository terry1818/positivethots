import { useEffect, useState } from "react";
import { m } from "motion/react";
import manifest from "@/assets/guides/manifest.json";
import { usePathAnimation } from "@/hooks/usePathAnimation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { spring } from "@/lib/motionTokens";

export type GuideName = keyof typeof manifest extends `${infer Name}.webp` ? Name : never;
const images = import.meta.glob<string>("/src/assets/guides/guide-*.webp", { eager: true, query: "?url", import: "default" });
export function tierGuide(tier: string | null): GuideName {
  const names: Record<string, GuideName> = { foundation: "guide-tier-foundation", sexual_health: "guide-tier-sexual-health", identity: "guide-tier-identity", relationships: "guide-tier-relationships", advanced: "guide-tier-advanced" };
  return names[tier || "foundation"] || "guide-tier-foundation";
}
let initialLoads = new Set<string>();
let interacted = false;
export function GuideArt({ name, size, className = "", alt = "", animate = true }: { name: GuideName; size: number; className?: string; alt?: string; animate?: boolean }) {
  const { ref, running, visible } = usePathAnimation<HTMLSpanElement>();
  const reduced = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const load = () => {
      if (!visible) return;
      const limited = window.location.pathname === "/learn" && !interacted;
      if (limited && (name === "guide-high-five" || !initialLoads.has(name) && initialLoads.size >= 3)) return;
      if (limited) initialLoads.add(name);
      setLoaded(true);
    };
    const release = () => { interacted = true; load(); };
    load();
    for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) window.addEventListener(event, release, { passive: true });
    return () => { for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) window.removeEventListener(event, release); };
  }, [visible, name]);
  const [width, height] = manifest[`${name}.webp`];
  return <m.span ref={ref} className={`guide-art ${className}`} style={{ height: size, width: size * width / height, maxWidth: "100%", aspectRatio: `${width}/${height}` }}
    initial={animate ? reduced ? { opacity: 0 } : { opacity: 0, scale: .8 } : false} animate={{ opacity: 1, scale: 1 }} transition={reduced ? { duration: .1 } : { type: "spring", ...spring.pop }}>
    <img src={loaded ? images[`/src/assets/guides/${name}.webp`] : undefined} width={width} height={height} loading="lazy" decoding="async" alt={alt} data-guide={name}
      className={animate && !reduced && running ? "guide-art-image guide-floating" : "guide-art-image"}/>
  </m.span>;
}