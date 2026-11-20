import type { ReactNode, RefObject } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { X } from "lucide-react";

export function BottomSheet({ open, onOpenChange, title, children, tone = "neutral", dismissible = true, initialFocusRef }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; children: ReactNode;
  tone?: "neutral" | "success" | "miss";
  dismissible?: boolean; initialFocusRef?: RefObject<HTMLButtonElement>;
}) {
  const reduced = useReducedMotion();
  const toneClass = tone === "success" ? "quiz-feedback-success" : tone === "miss" ? "quiz-feedback-miss" : "text-foreground";
  return <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false} dismissible={dismissible} modal>
    <DrawerContent onOpenAutoFocus={event => { if (initialFocusRef?.current) { event.preventDefault(); initialFocusRef.current.focus(); } }} aria-describedby={undefined} className={reduced ? "learn-sheet-reduced" : undefined}>
      <DrawerHeader className="flex items-center justify-between gap-4">
        <DrawerTitle className={toneClass}>{title}</DrawerTitle>
        {dismissible && <Button variant="ghost" size="icon" className="min-h-11 min-w-11" onClick={() => onOpenChange(false)} aria-label="Close"><X className="h-5 w-5" /></Button>}
      </DrawerHeader>
      <div className="p-4 pt-0 max-h-[75dvh] overflow-y-auto pb-[max(16px,env(safe-area-inset-bottom))]">{children}</div>
    </DrawerContent>
  </Drawer>;
}