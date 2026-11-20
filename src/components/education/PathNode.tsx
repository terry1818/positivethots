import { useEffect, useRef, useState } from "react";
import { m } from "motion/react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { usePathAnimation } from "@/hooks/usePathAnimation";
import { spring } from "@/lib/motionTokens";
import { cn } from "@/lib/utils";
import { POINTER_AWAY, startIdleBeckon, subscribePointer } from "@/lib/pointerFx";
import { ChestArt, PathIcon, type PathIconKind } from "./pathIcons";

export interface PathNodeProps {
  id: string; kind: PathIconKind | "chest"; label: string; title: string; subtitle: string;
  tier: string; state: "available" | "current" | "done" | "locked" | "premium-locked";
  started?: boolean; progress?: number; reason?: string; onGo: () => void;
  open: boolean; onOpenChange: (open: boolean) => void; index?: number; celebrate?: boolean; bubble?: boolean; hop?: boolean;
}
export function PathNode({ id, kind, label, title, subtitle, tier, state, started, progress = 0, reason, onGo, open, onOpenChange, index = 0, celebrate = false, bubble = true, hop = false }: PathNodeProps) {
  const { ref, reduced, running } = usePathAnimation<HTMLDivElement>();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [shake, setShake] = useState(0);
  const [burst, setBurst] = useState(false);
  const [swept, setSwept] = useState(false);
  const { playNodeTap, playCardOpen, playLockedTap, playLessonStart } = useSoundEffects();
  const locked = state === "locked" || state === "premium-locked";
  const [ripple, setRipple] = useState(0);
  const [perform, setPerform] = useState(false);
  const [peek, setPeek] = useState(false);
  const press = useRef(0);
  const kicker = kind === "lesson" ? `Lesson ${subtitle.split("|")[0]}` : kind === "badge" ? "Badge Check" : kind === "review" ? "Tier Review" : kind;
  // Magnetic pull: a node the learner can open leans toward a nearby pointer.
  useEffect(() => {
    if (locked || reduced || !running) return;
    let pulled = false;
    return subscribePointer((x, y) => {
      const el = buttonRef.current; if (!el) return;
      let mx = 0; let my = 0;
      if (x !== POINTER_AWAY) {
        const rect = el.getBoundingClientRect();
        const dx = x - (rect.left + rect.width / 2); const dy = y - (rect.top + rect.height / 2);
        const distance = Math.hypot(dx, dy);
        if (distance > 0 && distance < 130) { const pull = (1 - distance / 130) * 7; mx = dx / distance * pull; my = dy / distance * pull; }
      }
      if (!mx && !my && !pulled) return; // far nodes are left untouched
      pulled = mx !== 0 || my !== 0;
      el.style.setProperty("--mag-x", `${mx.toFixed(1)}px`); el.style.setProperty("--mag-y", `${my.toFixed(1)}px`);
    });
  }, [locked, reduced, running]);
  // The current node asks for attention when the page sits idle.
  useEffect(() => (state === "current" && !reduced ? startIdleBeckon() : undefined), [state, reduced]);
  // Touch has no hover: a long press, or the tap itself, plays the same performance.
  const calm = useRef(0);
  const playPerform = (withLabel = false) => { setPerform(true); setPeek(withLabel); window.clearTimeout(calm.current); calm.current = window.setTimeout(() => { setPerform(false); setPeek(false); }, withLabel ? 1600 : 1100); };
  const endPress = () => window.clearTimeout(press.current);
  useEffect(() => () => { window.clearTimeout(press.current); window.clearTimeout(calm.current); }, []);
  useEffect(() => { if (!celebrate || reduced) return; setBurst(true); const timer = setTimeout(() => setBurst(false), 900); return () => clearTimeout(timer); }, [celebrate, reduced]);
  return <div ref={ref} className={cn("path-object", `learn-tier-${tier}`, running ? "path-running" : "path-paused")}>
    {state === "current" && <><span className="path-halo" aria-hidden="true"/><svg className="path-current-ring" viewBox="0 0 104 104" aria-hidden="true"><defs><linearGradient id={`ring-${id}`}><stop className="path-ring-start"/><stop offset="1" className="path-ring-end"/></linearGradient></defs><circle cx="52" cy="52" r="47" className="path-ring-track"/><circle cx="52" cy="52" r="47" stroke={`url(#ring-${id})`} strokeDasharray={`${Math.max(12, progress) * 2.95} 295`} transform="rotate(-90 52 52)"/></svg></>}
    {state === "current" && bubble && <m.span initial={hop && !reduced ? { x: -44, y: -100, opacity: 0 } : false} animate={hop && !reduced ? { x: [-44, -22, 0], y: [-100, -128, 0], opacity: [0, 1, 1] } : { x: 0, y: 0, opacity: 1 }} layoutId="path-start-bubble" transition={reduced ? { duration: 0.1 } : hop ? { duration: 0.5 } : { type: "spring", ...spring.pop }} className="path-start-bubble" data-current-bubble>{started ? "Continue" : "Start"}</m.span>}
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild><Button ref={buttonRef} variant="ghost" aria-label={label} className={cn("path-node-button", `path-state-${state}`, kind === "badge" && "path-node-badge", kind === "chest" && "path-node-chest", perform && "path-perform", peek && "path-peek")} onPointerDown={event => { if (event.pointerType === "touch") press.current = window.setTimeout(() => playPerform(true), 350); }} onPointerUp={endPress} onPointerLeave={endPress} onPointerCancel={endPress} onClick={() => { setRipple(count => count + 1); playPerform(false); if (locked) { playLockedTap(); setShake(v => v + 1); } else playNodeTap(); if (!open) playCardOpen(); }}>
        <m.span key={shake} className={cn("path-node-motion", reduced && "path-node-reduced")} initial={reduced ? false : { scale: 0.8, opacity: 0 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} onViewportEnter={() => setSwept(true)} transition={{ type: "spring", ...spring.pop, delay: index * 0.06 }} animate={reduced ? {} : shake ? { x: [0, -3, 3, -3, 0] } : celebrate ? { scale: [1, 1.25, 1] } : { x: 0 }}>
          <span className={cn("path-node-face", swept && state === "done" && "path-done-shine")}>
            {kind === "chest" ? <ChestArt open={state === "done"} reduced={reduced}/> : <PathIcon kind={state === "done" ? "check" : locked ? "lock" : kind}/>}
          </span>
          {state === "done" && kind !== "chest" && <span className="path-pinned-star"><PathIcon kind="star"/></span>}
          {state === "premium-locked" && <span className="path-pinned-star"><PathIcon kind="crown"/></span>}
        </m.span>
      </Button></PopoverTrigger>
      <PopoverContent side="bottom" sideOffset={16} collisionPadding={16} className={`path-node-card learn-tier learn-tier-${tier}`} aria-label={`${title} details`} onCloseAutoFocus={event => { event.preventDefault(); requestAnimationFrame(() => buttonRef.current?.focus({ preventScroll: true })); }}>
        <p className="path-card-kicker">{kicker}</p>
        <h4 className="text-lg font-bold leading-snug">{title}</h4>
        <p className="mt-2 text-sm">{locked ? reason : subtitle.includes("|") ? subtitle.split("|")[1] : subtitle}</p>
        {!locked && <Button className="path-chunky-action mt-4 w-full" onClick={() => { if (kind === "lesson" || kind === "badge") playLessonStart(); onOpenChange(false); onGo(); }}>{state === "done" ? kind === "chest" ? "Opened" : "Review" : kind === "chest" ? "Open" : started ? "Continue" : "Start"}</Button>}
        <PopoverPrimitive.Arrow className="path-card-arrow" width={22} height={12}/>
      </PopoverContent>
    </Popover>
    {ripple > 0 && !reduced && <span key={ripple} className="path-ripple" aria-hidden="true"/>}
    {!open && <span className="path-hover-tip" aria-hidden="true"><b>{kicker}</b>{title}</span>}
    {burst && <div aria-hidden="true" className="path-particles">{Array.from({ length: 12 }, (_, i) => <m.i key={i} className={i % 2 ? "path-particle-tier" : "path-particle-gold"} initial={{ x: 0, y: 0, opacity: 1, scale: 1 }} animate={{ x: Math.cos(i * Math.PI / 6) * 80, y: Math.sin(i * Math.PI / 6) * 80, opacity: 0, scale: 0.2 }} transition={{ duration: 0.8 }}/>)}</div>}
  </div>;
}