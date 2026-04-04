import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { GraduationCap, Info } from "lucide-react";

export interface EducationFilters {
  minTier: string;
  requiredBadges: string[];
  activeOnly: boolean;
  minLeague: string;
}

interface EducationFilterProps {
  filters: EducationFilters;
  onFiltersChange: (filters: EducationFilters) => void;
}

const TIERS = [
  { value: 'any', label: 'Any', min: 0 },
  { value: 'foundation', label: 'Foundation', min: 1 },
  { value: 'intermediate', label: 'Intermediate', min: 6 },
  { value: 'advanced', label: 'Advanced', min: 11 },
  { value: 'master', label: 'Master', min: 16 },
];

const LEAGUES = [
  { value: 'any', label: 'Any', color: '' },
  { value: 'bronze', label: 'Bronze+', color: 'bg-amber-700/20 text-amber-500' },
  { value: 'silver', label: 'Silver+', color: 'bg-gray-400/20 text-gray-300' },
  { value: 'gold', label: 'Gold+', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'diamond', label: 'Diamond+', color: 'bg-cyan-400/20 text-cyan-300' },
  { value: 'champion', label: 'Champion', color: 'bg-gradient-to-r from-primary/20 to-amber-500/20 text-primary' },
];

export const EducationFilter = ({ filters, onFiltersChange }: EducationFilterProps) => {
  const { data: modules = [] } = useQuery({
    queryKey: ['education-modules-filter'],
    queryFn: async () => {
      const { data } = await supabase
        .from('education_modules')
        .select('id, slug, title, badge_number')
        .order('order_index', { ascending: true });
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const activeCount = [
    filters.minTier !== 'any' ? 1 : 0,
    filters.requiredBadges.length,
    filters.activeOnly ? 1 : 0,
    filters.minLeague !== 'any' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const update = (partial: Partial<EducationFilters>) => {
    onFiltersChange({ ...filters, ...partial });
  };

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="education" className="border rounded-xl px-3 bg-card">
        <AccordionTrigger className="text-sm font-semibold py-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Education
            {activeCount > 0 && (
              <Badge variant="secondary" className="text-xs h-5 px-1.5">{activeCount}</Badge>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4 space-y-4">
          {/* Minimum Tier */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs font-medium">Minimum Education Tier</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p className="text-xs">Filter by how many badges someone has completed</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TIERS.map(tier => (
                <button
                  key={tier.value}
                  onClick={() => update({ minTier: tier.value })}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[32px]",
                    filters.minTier === tier.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          {/* Specific Badges */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs font-medium">Specific Badges</Label>
              {filters.requiredBadges.length > 0 && (
                <span className="text-xs text-muted-foreground">{filters.requiredBadges.length} selected</span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {modules.slice(0, 20).map(mod => {
                const isSelected = filters.requiredBadges.includes(mod.slug);
                return (
                  <button
                    key={mod.id}
                    onClick={() => {
                      const next = isSelected
                        ? filters.requiredBadges.filter(s => s !== mod.slug)
                        : [...filters.requiredBadges, mod.slug];
                      update({ requiredBadges: next });
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-lg text-center transition-all min-h-[44px]",
                      isSelected
                        ? "bg-primary/20 ring-1 ring-primary"
                        : "bg-muted/30 hover:bg-muted/50"
                    )}
                  >
                    <span className="text-base">🏅</span>
                    <span className="text-[10px] leading-tight line-clamp-2">{mod.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Learner */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <Label className="text-xs font-medium">Currently Active</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p className="text-xs">Show only people actively learning right now</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch checked={filters.activeOnly} onCheckedChange={(v) => update({ activeOnly: v })} />
          </div>

          {/* Sprint League */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs font-medium">Sprint League</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p className="text-xs">Filter by weekly learning sprint league tier</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {LEAGUES.map(league => (
                <button
                  key={league.value}
                  onClick={() => update({ minLeague: league.value })}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[32px]",
                    filters.minLeague === league.value
                      ? "bg-primary text-primary-foreground"
                      : league.color || "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {league.label}
                </button>
              ))}
            </div>
          </div>

          {activeCount > 0 && (
            <button
              onClick={() => update({ minTier: 'any', requiredBadges: [], activeOnly: false, minLeague: 'any' })}
              className="text-xs text-primary underline"
            >
              Reset Education Filters
            </button>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
