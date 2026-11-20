import { useEffect, useState } from "react";
import { GuideArt, type GuideName } from "@/components/mascot/GuideArt";
import { usePathAnimation } from "@/hooks/usePathAnimation";
import { PathIcon } from "./pathIcons";


function Decoration({ index }: { index: number }) {
  const { ref, running } = usePathAnimation<HTMLDivElement>();
  return <div ref={ref} className={`path-decoration path-decoration-${index} ${running ? "path-running" : "path-paused"}`}><PathIcon kind={index % 3 === 0 ? "heart" : "star"}/></div>;
}

export function PathScenery({ spots, celebration }: { celebration: boolean; spots: { index: number; name: GuideName; offset: number }[] }) {
  const { ref, running } = usePathAnimation<HTMLDivElement>();
  const [nextIndex, setNextIndex] = useState(1);
  useEffect(() => {
    const update = () => {
      const stage = ref.current; if (!stage) return;
      const top = (document.querySelector("header.sticky")?.getBoundingClientRect().bottom || 120) - stage.getBoundingClientRect().top;
      const next = spots.findIndex((spot, i) => i > 0 && spot.index * 152 >= top);
      setNextIndex(next < 0 ? 1 : next);
    };
    update(); window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [spots]);
  const shown = spots.length > 1 ? [spots[0], spots[nextIndex] || spots[1]] : spots;
  return <div ref={ref} className={`path-scenery ${running ? "path-running" : "path-paused"}`} aria-hidden="true">
    {shown.map((spot, i) => <div key={`${spot.index}:${spot.name}`} className={`path-guide-placement ${spot.offset >= 0 ? "path-mascot-left" : "path-mascot-right"}`} style={{ top: spot.index * 152 + 8 }}><GuideArt name={celebration && i === 0 ? "guide-high-five" : spot.name} size={112} className="path-guide"/></div>)}
    {Array.from({ length: 6 }, (_, i) => <Decoration key={i} index={i}/>)}
  </div>;
}
