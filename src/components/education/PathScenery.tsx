import { Mascot, type MascotMood } from "@/components/mascot/Mascot";
import { usePathAnimation } from "@/hooks/usePathAnimation";
import { PathIcon } from "./pathIcons";
import { useEffect, useState } from "react";

function Decoration({ index }: { index: number }) {
  const { ref, running } = usePathAnimation<HTMLDivElement>();
  return <div ref={ref} className={`path-decoration path-decoration-${index} ${running ? "path-running" : "path-paused"}`}><PathIcon kind={index % 3 === 0 ? "heart" : "star"}/></div>;
}

export function PathScenery({ mood, index, offset, celebration, spots = [] }: { mood: MascotMood; index: number; offset: number; celebration: boolean; spots?: { index: number; mood: MascotMood; offset: number }[] }) {
  const { ref, running } = usePathAnimation<HTMLDivElement>();
  const [nearest, setNearest] = useState({ index, mood, offset });
  useEffect(() => {
    const update = () => {
      const stage = ref.current;
      if (!stage) return;
      const headerBottom = document.querySelector("header.sticky")?.getBoundingClientRect().bottom || 120;
      const middle = headerBottom + 200 - stage.getBoundingClientRect().top;
      const positions = [{ index, mood, offset }, ...spots];
      const next = positions.reduce((best, candidate) => Math.abs(candidate.index * 152 - middle) < Math.abs(best.index * 152 - middle) ? candidate : best);
      setNearest(previous => previous.index === next.index && previous.mood === next.mood ? previous : next);
    };
    update(); window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [index, mood, offset, spots]);
  return <div ref={ref} className={`path-scenery ${running ? "path-running" : "path-paused"}`} aria-hidden="true">
    <div className={`path-mascot ${nearest.offset >= 0 ? "path-mascot-left" : "path-mascot-right"}`} style={{ top: nearest.index * 152 + 24 }}><Mascot mood={celebration ? "celebration" : nearest.mood} size="path" animate={false} alt=""/></div>
    {Array.from({ length: 6 }, (_, i) => <Decoration key={i} index={i}/>)}
  </div>;
}