import { useEffect, useState } from "react";
import { Check, Lock } from "lucide-react";
import { BottomSheet } from "@/components/motion/BottomSheet";
import { Button } from "@/components/ui/button";
import { filterLabel, filtersActive, NO_FILTERS, type DiscoverFilters } from "@/lib/discoverFilters";

/** Filters for Discover. Unlocked by finishing the Identity lessons or with Premium or VIP. */
export function DiscoverFilterSheet({ open, onOpenChange, unlocked, value, options, onApply, onLearn, onPlans }: {
  open: boolean; onOpenChange: (open: boolean) => void; unlocked: boolean; value: DiscoverFilters;
  options: { genders: string[]; styles: string[] }; onApply: (f: DiscoverFilters) => void; onLearn: () => void; onPlans: () => void;
}) {
  const [draft, setDraft] = useState<DiscoverFilters>(value);
  useEffect(() => { if (open) setDraft(value); }, [open, value]);
  const toggle = (group: "genders" | "styles", v: string) =>
    setDraft((d) => ({ ...d, [group]: d[group].includes(v) ? d[group].filter((x) => x !== v) : [...d[group], v] }));

  const Group = ({ title, group, values }: { title: string; group: "genders" | "styles"; values: string[] }) => (
    <fieldset className="space-y-2">
      <legend className="text-base font-extrabold">{title}</legend>
      {values.length === 0 ? <p className="text-sm text-muted-foreground">No one nearby has shared this yet.</p> : (
        <div className="flex flex-wrap gap-2">
          {values.map((v) => {
            const on = draft[group].includes(v);
            return (
              <button key={v} type="button" className="kit-option kit-option-sm" aria-pressed={on} data-selected={on ? "true" : undefined} onClick={() => toggle(group, v)}>
                {on && <Check className="h-4 w-4" aria-hidden="true" />}{filterLabel(v)}
              </button>
            );
          })}
        </div>
      )}
    </fieldset>
  );

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Filters">
      <div className="kit-area-discover max-h-[70dvh] space-y-5 overflow-y-auto pb-2">
        {!unlocked ? (
          <div className="space-y-3 text-center">
            <span className="kit-coin kit-coin-lg mx-auto" data-tone="quiet"><Lock aria-hidden="true" /></span>
            <h3 className="text-xl font-extrabold [text-wrap:balance]">Filters unlock two ways</h3>
            <p className="text-muted-foreground [text-wrap:pretty]">Finish the Identity lessons and they are yours for free. They also come with Premium and VIP.</p>
            <Button className="kit-cta w-full" onClick={onLearn}>Go to Identity lessons</Button>
            <Button variant="outline" className="min-h-[44px] w-full font-bold" onClick={onPlans}>See plans</Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground [text-wrap:pretty]">Choose who you'd like to see. Leave a group empty to see everyone.</p>
            <Group title="Gender" group="genders" values={options.genders} />
            <Group title="Relationship style" group="styles" values={options.styles} />
            <Button className="kit-cta w-full" onClick={() => { onApply(draft); onOpenChange(false); }}>Show people</Button>
            {filtersActive(draft) && (
              <Button variant="ghost" className="min-h-[44px] w-full font-bold" onClick={() => { onApply(NO_FILTERS); onOpenChange(false); }}>Clear filters</Button>
            )}
          </>
        )}
      </div>
    </BottomSheet>
  );
}
