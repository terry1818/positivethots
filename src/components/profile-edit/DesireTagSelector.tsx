import { useState, useMemo } from "react";
import { useDesireOptions, useUserDesires, useDesireMutations, DESIRE_CATEGORIES, CATEGORY_COLORS, type DesireOption } from "@/hooks/useDesires";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Lock, Star, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface DesireTagSelectorProps {
  userEducationTier?: number;
}

export const DesireTagSelector = ({ userEducationTier = 0 }: DesireTagSelectorProps) => {
  const { user } = useAuth();
  const { data: options, isLoading: optionsLoading } = useDesireOptions();
  const { data: userDesires, isLoading: desiresLoading } = useUserDesires(user?.id);
  const { toggleDesire, updatePriority } = useDesireMutations();
  const [activeTab, setActiveTab] = useState<string>("Relationship Style");

  const selectedIds = useMemo(
    () => new Set((userDesires || []).map(d => d.desire_id)),
    [userDesires]
  );

  const priorityMap = useMemo(
    () => new Map((userDesires || []).map(d => [d.desire_id, d.priority])),
    [userDesires]
  );

  const selectedCount = selectedIds.size;
  const MAX_DESIRES = 20;

  const optionsByCategory = useMemo(() => {
    const map = new Map<string, DesireOption[]>();
    (options || []).forEach(opt => {
      const existing = map.get(opt.category) || [];
      existing.push(opt);
      map.set(opt.category, existing);
    });
    return map;
  }, [options]);

  if (optionsLoading || desiresLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
        </div>
      </div>
    );
  }

  const handleToggle = (desireId: string) => {
    const isSelected = selectedIds.has(desireId);
    if (!isSelected && selectedCount >= MAX_DESIRES) {
      return; // Enforce max
    }
    toggleDesire.mutate({ desireId, selected: !isSelected });
  };

  const cyclePriority = (desireId: string) => {
    const current = priorityMap.get(desireId) || 0;
    const next = current >= 2 ? 0 : current + 1;
    updatePriority.mutate({ desireId, priority: next });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">Your Desires & Interests</h3>
        <Badge variant="outline" className="text-xs">
          {selectedCount}/{MAX_DESIRES}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex overflow-x-auto gap-1 bg-transparent justify-start pb-1">
          {DESIRE_CATEGORIES.map(cat => (
            <TabsTrigger
              key={cat}
              value={cat}
              className="text-xs px-3 py-1.5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap"
            >
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        {DESIRE_CATEGORIES.map(cat => (
          <TabsContent key={cat} value={cat} className="mt-3">
            <div className="flex flex-wrap gap-2">
              {(optionsByCategory.get(cat) || []).map(opt => {
                const isSelected = selectedIds.has(opt.id);
                const isLocked = opt.requires_education_tier > userEducationTier;
                const priority = priorityMap.get(opt.id) || 0;

                return (
                  <TooltipProvider key={opt.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          disabled={isLocked || toggleDesire.isPending}
                          onClick={() => isSelected ? cyclePriority(opt.id) : handleToggle(opt.id)}
                          onDoubleClick={() => isSelected ? handleToggle(opt.id) : undefined}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all min-h-[36px]",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                            isLocked && "opacity-50 cursor-not-allowed",
                            isSelected
                              ? cn(CATEGORY_COLORS[cat], "shadow-sm")
                              : "bg-muted/40 text-foreground border border-border hover:border-primary/50"
                          )}
                          aria-label={`${opt.label}${isLocked ? " (locked)" : isSelected ? " (selected)" : ""}`}
                          aria-pressed={isSelected}
                        >
                          {isLocked && <Lock className="h-3 w-3" />}
                          {opt.emoji && <span>{opt.emoji}</span>}
                          <span>{opt.label}</span>
                          {isSelected && priority >= 1 && (
                            <Star className={cn("h-3 w-3", priority >= 2 ? "fill-current text-amber-300" : "text-amber-300")} />
                          )}
                          {isSelected && priority >= 2 && (
                            <Star className="h-3 w-3 fill-current text-amber-300" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[250px] text-sm">
                        {isLocked
                          ? `Complete Tier ${opt.requires_education_tier} education to unlock`
                          : opt.description || opt.label}
                        {isSelected && !isLocked && (
                          <span className="block text-xs text-muted-foreground mt-1">
                            Tap to set priority • Double-tap to remove
                          </span>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
