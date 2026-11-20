// Shared, frame-throttled pointer tracking for the interactive motion layer.
// One window listener serves every subscriber; nothing runs on touch-only,
// low-power or reduced-motion devices.

type PointerSub = (x: number, y: number) => void;
const subs = new Set<PointerSub>();
let px = -9999;
let py = -9999;
let frame = 0;
let stagesAt = 0;
let stages: HTMLElement[] = [];
let sceneries: HTMLElement[] = [];

export const POINTER_AWAY = -9999;

export function canTrackPointer(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowPower = nav.deviceMemory !== undefined ? nav.deviceMemory <= 2 : (nav.hardwareConcurrency || 8) <= 4;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches
    && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    && !lowPower;
}

function paintPathStages() {
  const now = performance.now();
  if (now - stagesAt > 1000) { stages = Array.from(document.querySelectorAll<HTMLElement>(".path-level-stage")); sceneries = Array.from(document.querySelectorAll<HTMLElement>(".path-scenery")); stagesAt = now; }
  // Normalised -1..1 pointer position drives the depth parallax of path scenery.
  const away = px === POINTER_AWAY;
  const nx = away ? "0" : ((px / window.innerWidth) * 2 - 1).toFixed(2);
  const ny = away ? "0" : ((py / window.innerHeight) * 2 - 1).toFixed(2);
  for (const scenery of sceneries) { scenery.style.setProperty("--pt-px", nx); scenery.style.setProperty("--pt-py", ny); }
  for (const stage of stages) {
    const rect = stage.getBoundingClientRect();
    const near = px > rect.left - 60 && px < rect.right + 60 && py > rect.top - 60 && py < rect.bottom + 60;
    if (near) {
      stage.style.setProperty("--spot-x", `${px - rect.left + 12}px`);
      stage.style.setProperty("--spot-y", `${py - rect.top}px`);
      stage.dataset.spot = "1";
    } else if (stage.dataset.spot) delete stage.dataset.spot;
  }
}

function flush() {
  frame = 0;
  paintPathStages();
  subs.forEach(sub => sub(px, py));
}
const schedule = () => { if (!frame) frame = requestAnimationFrame(flush); };
const onMove = (event: PointerEvent) => { if (event.pointerType === "touch") return; px = event.clientX; py = event.clientY; schedule(); };
const onAway = () => { px = POINTER_AWAY; py = POINTER_AWAY; schedule(); };
const onScroll = () => { if (px !== POINTER_AWAY) schedule(); };

/** Subscribe to pointer positions (client coordinates). Returns an unsubscribe function. */
export function subscribePointer(sub: PointerSub): () => void {
  if (!canTrackPointer()) return () => {};
  if (subs.size === 0) {
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("pointerleave", onAway);
    window.addEventListener("blur", onAway);
  }
  subs.add(sub);
  return () => {
    subs.delete(sub);
    if (subs.size > 0) return;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("scroll", onScroll);
    document.documentElement.removeEventListener("pointerleave", onAway);
    window.removeEventListener("blur", onAway);
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
  };
}

// ---- Reactions: characters respond to what the learner just did -------------
export type Reaction = "correct" | "miss" | "combo" | "win" | "chest";
const REACT_EVENT = "pt:react";
export function emitReaction(type: Reaction) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent<Reaction>(REACT_EVENT, { detail: type }));
}
export function onReaction(handler: (type: Reaction) => void): () => void {
  const listener = (event: Event) => handler((event as CustomEvent<Reaction>).detail);
  window.addEventListener(REACT_EVENT, listener);
  return () => window.removeEventListener(REACT_EVENT, listener);
}

// ---- Idle beckon: the current path node asks for attention when nothing happens
let idleUsers = 0;
let idleTimer = 0;
let idleLevel = 0;
const setIdle = (level: number) => { idleLevel = level; document.documentElement.dataset.ptIdle = String(level); };
const armIdle = () => {
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => { if (idleLevel < 3) { setIdle(idleLevel + 1); armIdle(); } }, 8000);
};
const onActivity = () => { if (idleLevel !== 0) setIdle(0); armIdle(); };
const ACTIVITY = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart"] as const;
export function startIdleBeckon(): () => void {
  if (typeof window === "undefined") return () => {};
  if (idleUsers++ === 0) {
    for (const name of ACTIVITY) window.addEventListener(name, onActivity, { passive: true });
    setIdle(0); armIdle();
  }
  return () => {
    if (--idleUsers > 0) return;
    for (const name of ACTIVITY) window.removeEventListener(name, onActivity);
    window.clearTimeout(idleTimer);
    delete document.documentElement.dataset.ptIdle;
  };
}
