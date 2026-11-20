import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PressScale } from "@/components/motion/PressScale";
import { ProgressRing } from "@/components/motion/ProgressRing";

export function LearnContinueBar({ title, percent, section, totalSections, started, review, onContinue }: {
  title: string; percent: number; section: number; totalSections: number; started: boolean; review: boolean; onContinue: () => void;
}) {
  const [navHeight, setNavHeight] = useState(88);
  useEffect(() => {
    const nav = document.querySelector('[aria-label="Main navigation"]');
    if (!nav) return;
    const observer = new ResizeObserver(() => setNavHeight(nav.getBoundingClientRect().height));
    observer.observe(nav);
    setNavHeight(nav.getBoundingClientRect().height);
    return () => observer.disconnect();
  }, []);
  return <aside aria-label="Continue learning" className="fixed inset-x-0 z-40 border-t border-border bg-card" style={{ bottom: navHeight }}>
    <div className="mx-auto flex h-[64px] max-w-[480px] items-center gap-2 px-4">
      <ProgressRing size={40} strokeWidth={4} percent={percent}><span className="text-xs text-foreground">{percent}%</span></ProgressRing>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{review ? "Review a lesson" : title}</p>
        <p className="truncate text-xs text-muted-foreground">{review ? title : `Section ${section} of ${totalSections}`}</p>
      </div>
      <PressScale><Button onClick={onContinue} className="learn-continue-button h-[44px] min-h-[44px] px-4" aria-label={`${review ? "Review" : started ? "Continue" : "Start"} ${title}`}>
        {review ? "Review" : started ? "Continue" : "Start"}
      </Button></PressScale>
    </div>
  </aside>;
}