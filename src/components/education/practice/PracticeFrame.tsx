import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { QuizCombo } from "../QuizCombo";

export function PracticeFrame({ title, current, total, combo = 0, onExit, children }: { title: string; current: number; total: number; combo?: number; onExit: () => void; children: React.ReactNode }) {
  return <main className="min-h-[100dvh] max-w-[480px] mx-auto p-4 pt-[max(16px,env(safe-area-inset-top))] space-y-6"><header className="relative flex gap-3 items-center"><Button variant="ghost" size="icon" aria-label="Exit practice" onClick={onExit}><X/></Button><h1 className="flex-1 text-lg font-bold">{title}</h1><span className="text-sm text-muted-foreground">{current}/{total}</span><QuizCombo combo={combo}/></header><div role="progressbar" aria-label="Practice progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current} className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-learn-info" style={{ width: `${total ? current / total * 100 : 0}%` }}/></div>{children}</main>;
}