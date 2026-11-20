import { useEffect, useRef, useState } from "react";
import { m } from "motion/react";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { practiceQueue } from "@/lib/practiceHub";
import { PracticeFrame } from "./PracticeFrame";
import { PathIcon } from "../pathIcons";

export interface FlashIdea { id: string; title: string; takeaway: string }
export default function FlashPractice({ cards, onComplete, onExit }: { cards: FlashIdea[]; onComplete: (accuracy: number, total: number) => void; onExit: () => void }) {
  const [queue, setQueue] = useState(cards.map((_, i) => i)); const [repeated, setRepeated] = useState(new Set<number>());
  const [flipped, setFlipped] = useState(false); const [known, setKnown] = useState(0); const [rated, setRated] = useState(0);
  const reduced = useReducedMotion(); const { playNodeTap, playCardAdvance } = useSoundEffects();
  const front = useRef<HTMLButtonElement>(null); const back = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (flipped) back.current?.focus(); else front.current?.focus(); }, [flipped, queue[0]]);
  const card = cards[queue[0]]; if (!card) return null;
  const rate = (again: boolean) => { const next = practiceQueue(queue, repeated, again); const count = rated + 1, got = known + Number(!again); setRated(count); setKnown(got); if (!next.queue.length) { onComplete(Math.round(got / count * 100), cards.length); return; } playCardAdvance(); setQueue(next.queue); setRepeated(next.repeated); setFlipped(false); };
  return <PracticeFrame title="Flash cards" current={rated} total={cards.length + repeated.size} onExit={onExit}><div className="practice-flip-stage"><m.div key={card.id} initial={false} animate={reduced ? { opacity: 1 } : { rotateY: flipped ? 180 : 0 }} transition={{ duration: .3 }} className="practice-flip-inner"><Button ref={front} className="practice-flash-face practice-flash-front" onClick={() => { playNodeTap(); setFlipped(!flipped); }} onKeyDown={event => { if (event.code === "Space") { event.preventDefault(); playNodeTap(); setFlipped(v => !v); } }} aria-label={flipped ? "Show question" : `Flip card: ${card.title}`} aria-pressed={flipped} tabIndex={flipped ? -1 : 0} aria-hidden={flipped}><PathIcon kind="lesson"/><strong>{card.title}</strong><span>What's the key idea?</span></Button><Button ref={back} className="practice-flash-face practice-flash-back" tabIndex={flipped ? 0 : -1} aria-label="Show question" aria-hidden={!flipped} onClick={() => setFlipped(false)}><strong>{card.title}</strong><span>{card.takeaway}</span></Button></m.div></div><p className="sr-only" aria-live="polite">{flipped ? `Answer: ${card.takeaway}` : card.title}</p>{flipped && <div className="grid grid-cols-2 gap-3"><Button className="min-h-[56px]" onClick={() => rate(false)}>Got it</Button><Button variant="outline" className="min-h-[56px]" onClick={() => rate(true)}>Show me again</Button></div>}</PracticeFrame>;
}