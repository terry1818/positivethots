import { BottomSheet } from "@/components/motion/BottomSheet";
import { PressScale } from "@/components/motion/PressScale";
import { Button } from "@/components/ui/button";
import { WhatYoullLearn } from "./WhatYoullLearn";
import { useModuleCounts } from "@/hooks/useModuleCounts";
import { Skeleton } from "@/components/ui/skeleton";
export function ModuleGuide({ module, icon, reason, premium, earned, started, features, onClose, onStart, onUpgrade }: {
  module: { id: string; slug: string; title: string; description: string; tier: string | null; estimated_minutes: number | null };
  icon: string; reason?: string; premium: boolean; earned: boolean; started: boolean; features: string[];
  onClose: () => void; onStart: () => void; onUpgrade: () => void;
}) {
  const counts = useModuleCounts();
  const count = counts.data?.find(c => c.module_id === module.id);
  return <BottomSheet open onOpenChange={open => { if (!open) onClose(); }} title={module.title}>
    <div className="max-h-[65dvh] space-y-4 overflow-y-auto">
      <div className="text-center text-4xl" aria-hidden="true">{icon}</div>
      <p>{module.description}</p>
      {counts.isLoading ? <Skeleton className="h-6 w-full" /> : counts.isError ? <Button variant="outline" onClick={() => void counts.refetch()}>Try again</Button> :
        <p className="text-sm text-muted-foreground">{count?.section_count ?? "—"} lessons · {count?.question_count ?? "—"} questions · about {module.estimated_minutes ?? "—"} min</p>}
      <WhatYoullLearn moduleSlug={module.slug} tier={module.tier || "foundation"} estimatedMinutes={module.estimated_minutes} />
      {features.length > 0 && <p>Finishing this unlocks: {features.join(", ")}</p>}
      {reason ? <p>{reason}</p> : <PressScale><Button className="learn-continue-button min-h-[44px] w-full" onClick={onStart}>{earned ? "Review" : started ? "Continue" : "Start"}</Button></PressScale>}
      {premium && <Button variant="outline" className="min-h-[44px] w-full" onClick={onUpgrade}>View plans</Button>}
    </div>
  </BottomSheet>;
}