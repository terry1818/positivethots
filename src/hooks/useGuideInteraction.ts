import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { POINTER_AWAY, onReaction, subscribePointer, type Reaction } from "@/lib/pointerFx";

export type GuideMove = "" | "jump" | "wiggle" | "sway" | "spin";
const LINES = ["You've got this.", "Ready when you are.", "One more?", "Nice to see you.", "Let's learn something.", "Look at you go."];
const REACTION_MOVE: Record<Reaction, GuideMove> = { correct: "jump", miss: "sway", combo: "spin", win: "jump", chest: "jump" };
const MAX_TILT = 8;
const MAX_DRAG = 40;

/**
 * Makes a character sticker answer the person: it tilts toward the mouse, lifts
 * and speaks on hover, jumps and bursts on tap, can be pulled and springs back,
 * and reacts to learning events. All of it is decoration: nothing here is
 * required to use the app, and it is disabled when `enabled` is false.
 */
export function useGuideInteraction(enabled: boolean, visible: boolean, onTap?: () => void) {
  const host = useRef<HTMLSpanElement>(null);
  const [hover, setHover] = useState(false);
  const [move, setMove] = useState<GuideMove>("");
  const [moveKey, setMoveKey] = useState(0);
  const [burst, setBurst] = useState(0);
  const [flip, setFlip] = useState(0);
  const [line, setLine] = useState("");
  const drag = useRef({ active: false, moved: false, x: 0, y: 0 });
  const touched = useRef(false);
  const lastLine = useRef(-1);

  const perform = useCallback((next: GuideMove, withBurst = false) => {
    setMove(next); setMoveKey(key => key + 1);
    if (withBurst) setBurst(key => key + 1);
  }, []);

  // 3D tilt and gloss follow the pointer while the sticker is on screen.
  useEffect(() => {
    if (!enabled || !visible) return;
    let resting = true;
    return subscribePointer((x, y) => {
      const el = host.current; if (!el) return;
      const rest = () => { if (resting) return; resting = true; el.style.setProperty("--gx", "0deg"); el.style.setProperty("--gy", "0deg"); el.style.setProperty("--gloss", "0"); };
      if (x === POINTER_AWAY) { rest(); return; }
      const rect = el.getBoundingClientRect();
      const dx = (x - (rect.left + rect.width / 2)) / 320;
      const dy = (y - (rect.top + rect.height / 2)) / 320;
      const reach = Math.hypot(dx, dy);
      // Far pointers leave the sticker alone, so idle stickers cost nothing per frame.
      if (reach > 1.6) { rest(); return; }
      resting = false;
      const clamp = (value: number) => Math.max(-1, Math.min(1, value));
      el.style.setProperty("--gx", `${(clamp(dx) * MAX_TILT).toFixed(2)}deg`);
      el.style.setProperty("--gy", `${(-clamp(dy) * MAX_TILT).toFixed(2)}deg`);
      el.style.setProperty("--sx", `${((x - rect.left) / rect.width * 100).toFixed(1)}%`);
      el.style.setProperty("--sy", `${((y - rect.top) / rect.height * 100).toFixed(1)}%`);
      el.style.setProperty("--gloss", reach < 0.9 ? "1" : "0");
    });
  }, [enabled, visible]);

  // React to what the learner just did, but only while this sticker is on screen.
  useEffect(() => {
    if (!enabled || !visible) return;
    return onReaction(type => perform(REACTION_MOVE[type], type === "win" || type === "combo" || type === "chest"));
  }, [enabled, visible, perform]);

  // One small wave if the screen sits untouched for a while.
  useEffect(() => {
    if (!enabled || !visible) return;
    const timer = window.setTimeout(() => { if (!touched.current) perform("wiggle"); }, 20000);
    return () => window.clearTimeout(timer);
  }, [enabled, visible, perform]);

  // Replay the move from its first frame, even when the same move repeats.
  useLayoutEffect(() => {
    const pop = host.current?.firstElementChild as HTMLElement | null;
    if (!moveKey || !pop) return;
    pop.style.animation = "none"; void pop.offsetWidth; pop.style.animation = "";
  }, [moveKey]);
  useEffect(() => { if (!move) return; const timer = window.setTimeout(() => setMove(""), 900); return () => window.clearTimeout(timer); }, [move, moveKey]);
  useEffect(() => { if (!burst) return; const timer = window.setTimeout(() => setBurst(0), 900); return () => window.clearTimeout(timer); }, [burst]);

  const handlers = enabled ? {
    onPointerEnter: (event: ReactPointerEvent) => {
      if (event.pointerType === "touch") return;
      touched.current = true;
      let next = Math.floor(Math.random() * LINES.length);
      if (next === lastLine.current) next = (next + 1) % LINES.length;
      lastLine.current = next; setLine(LINES[next]); setHover(true); perform("wiggle");
    },
    onPointerLeave: () => setHover(false),
    onPointerDown: (event: ReactPointerEvent<HTMLSpanElement>) => {
      touched.current = true;
      if (event.pointerType === "touch") return; // touch keeps native scrolling; tap still reacts
      drag.current = { active: true, moved: false, x: event.clientX, y: event.clientY };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: ReactPointerEvent<HTMLSpanElement>) => {
      const state = drag.current; if (!state.active) return;
      let dx = event.clientX - state.x; let dy = event.clientY - state.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 6) { state.moved = true; event.currentTarget.classList.add("is-dragging"); }
      if (distance > MAX_DRAG) { dx = dx / distance * MAX_DRAG; dy = dy / distance * MAX_DRAG; }
      event.currentTarget.style.setProperty("--dx", `${dx.toFixed(1)}px`);
      event.currentTarget.style.setProperty("--dy", `${dy.toFixed(1)}px`);
    },
    onPointerUp: (event: ReactPointerEvent<HTMLSpanElement>) => {
      const state = drag.current; if (!state.active) return;
      state.active = false;
      event.currentTarget.classList.remove("is-dragging");
      event.currentTarget.style.setProperty("--dx", "0px");
      event.currentTarget.style.setProperty("--dy", "0px");
      if (state.moved) perform("wiggle");
    },
    onClick: () => {
      if (drag.current.moved) { drag.current.moved = false; return; }
      perform("jump", true); setFlip(count => count + 1); onTap?.();
    },
  } : {};

  const classes = [enabled ? "guide-fx guide-fx-on" : "guide-fx", hover ? "is-hover" : "", move ? `guide-move-${move}` : ""].filter(Boolean).join(" ");
  return { host, handlers, classes, hover, line, burst, flip, moveKey, style: {} as CSSProperties };
}
