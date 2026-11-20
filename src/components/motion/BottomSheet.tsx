import type { ReactNode } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { X } from "lucide-react";

export function BottomSheet({ open, onOpenChange, title, children, tone = "neutral" }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; children: ReactNode;
  tone?: "neutral" | "success" | "miss";
}) {
  const reduced = useReducedMotion();
  const toneClass = tone === "success" ? "text-success" : tone === "miss" ? "text-destructive" : "text-foreground";
  return <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false} modal>
    <DrawerContent aria-describedby={undefined} className={reduced ? "learn-sheet-reduced" : undefined}>
      <DrawerHeader className="flex items-center justify-between gap-4">
        <DrawerTitle className={toneClass}>{title}</DrawerTitle>
        <Button variant="ghost" size="icon" className="min-h-11 min-w-11" onClick={() => onOpenChange(false)} aria-label="Close"><X className="h-5 w-5" /></Button>
      </DrawerHeader>
      <div className="p-4 pt-0">{children}</div>
    </DrawerContent>
  </Drawer>;
}