import { m } from "motion/react";
import { chestOpenDuration } from "@/lib/motionTokens";

export type PathIconKind = "lesson" | "story" | "practice" | "listen" | "badge" | "review" | "lock" | "check" | "star" | "crown" | "heart";
const shapes: Record<PathIconKind, React.ReactNode> = {
  lesson: <><path className="pi-page-l" d="M3 6c5-2 9-1 12 2v22c-4-3-8-4-12-2z"/><path className="pi-page-r" d="M29 6c-5-2-9-1-12 2v22c4-3 8-4 12-2z"/><path d="M7 10h4v2H7zm0 5h4v2H7zm14-5h4v2h-4zm0 5h4v2h-4z" className="path-icon-cut"/></>,
  story: <><path className="pi-bubble-a" d="M3 4h18a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H10l-7 5V8z"/><path className="pi-bubble-b" d="M27 12h2v12l-1 6-6-4H14v-4h8a5 5 0 0 0 5-5z"/></>,
  practice: <path className="pi-lift" d="M2 10h4V7h5v7h10V7h5v3h4v12h-4v3h-5v-7H11v7H6v-3H2z"/>,
  listen: <><path className="pi-phones" d="M3 17a13 13 0 0 1 26 0v9a4 4 0 0 1-4 4h-4V16h4a9 9 0 0 0-18 0h4v14H7a4 4 0 0 1-4-4z"/><g className="pi-eq"><rect x="12.6" y="19" width="1.8" height="9" rx=".9"/><rect x="15.1" y="19" width="1.8" height="9" rx=".9"/><rect x="17.6" y="19" width="1.8" height="9" rx=".9"/></g></>,
  badge: <><path d="m16 1 13 5v11c0 7-8 12-13 15C11 29 3 24 3 17V6z"/><path d="m16 7 2.6 5.3 5.9.9-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.9z" className="path-icon-cut pi-spin"/></>,
  review: <path className="pi-tilt" d="M9 2h14v4h7v7c0 5-4 8-9 8l-3 3v4h6v4H8v-4h6v-4l-3-3c-5 0-9-3-9-8V6h7zm0 8H6v3c0 2 1 3 4 4zm14 0-1 7c3-1 4-2 4-4v-3z"/>,
  lock: <path className="pi-jiggle" d="M8 13V9a8 8 0 0 1 16 0v4h2a3 3 0 0 1 3 3v13H3V16a3 3 0 0 1 3-3zm4 0h8V9a4 4 0 0 0-8 0zm2 7v6h4v-6z"/>,
  check: <path className="pi-pop" d="m3 16 5-5 6 6L25 5l5 5-16 18z"/>,
  star: <path d="m16 1 4.6 9.3L31 12l-7.5 7.3L25.3 30 16 25l-9.3 5 1.8-10.7L1 12l10.4-1.7z"/>,
  crown: <path d="m2 7 8 6 6-11 6 11 8-6-4 20H6z"/>,
  heart: <path d="M16 29 3 16C-5 5 9-3 16 7 23-3 37 5 29 16z"/>,
};
export function PathIcon({ kind, className = "" }: { kind: PathIconKind; className?: string }) {
  return <svg viewBox="0 0 32 32" aria-hidden="true" className={`path-filled-icon ${className}`} fill="currentColor">{shapes[kind]}</svg>;
}
export function TierEmblem({ tier }: { tier: string }) {
  const kind: PathIconKind = tier === "foundation" ? "badge" : tier === "sexual_health" ? "heart" : tier === "identity" ? "star" : tier === "relationships" ? "story" : "crown";
  return <div className="path-tier-emblem" aria-hidden="true"><PathIcon kind={kind}/></div>;
}
export function ChestArt({ open = false, reduced = false }: { open?: boolean; reduced?: boolean }) {
  return <svg viewBox="0 0 88 88" className="path-chest-art" aria-hidden="true">
    <ellipse cx="44" cy="79" rx="34" ry="5" className="path-chest-shadow"/>
    <path d="M12 44h64v30H12z" className="path-chest-wood"/>
    <path d="M14 47h60v7H14zm0 12h60v4H14z" className="path-chest-grain"/>
    <path d="M12 43h9v32h-9zm55 0h9v32h-9zM12 70h64v6H12z" className="path-chest-gold"/>
    {open && <path d="M18 39h52v9H18z" className="path-chest-shadow"/>}
    {!open && <path d="M15 41h58v4H15z" className="path-chest-glow"/>}
    <g className="path-chest-lid"><m.g initial={false} animate={{ y: open && !reduced ? -15 : 0, rotate: open && !reduced ? -12 : 0 }} transition={{ duration: chestOpenDuration }}>
      <path d="M10 42V30c0-14 68-14 68 0v12z" className="path-chest-wood"/>
      <path d="M10 37h68v8H10zM18 23h8v18h-8zm44 0h8v18h-8z" className="path-chest-gold"/>
      <path d="M36 36h16v18H36z" className="path-chest-gold"/><path d="M42 42h4v7h-4z" className="path-chest-shadow"/>
    </m.g></g>
  </svg>;
}