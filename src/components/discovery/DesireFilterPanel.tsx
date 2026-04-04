import { useState, useMemo } from "react";
import { useDesireOptions, DESIRE_CATEGORIES, CATEGORY_COLORS } from "@/hooks/useDesires";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filter, X, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DesireFilter {
  desireId: string;
  mustMatch: boolean;
}

interface DesireFilterPanelProps {
  onApplyFilters: (filters: DesireFilter[]) => void;
  currentFilters?: DesireFilter[];
}

export const DesireFilterPanel = ({ onApplyFilters, currentFilters = [] }: DesireFilterPanelProps) => {
  const { data: options } = useDesireOptions();
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<Map<string, boolean>>(
    () => new Map(currentFilters.map(f => [f.desireId, f.mustMatch]))
  );
  const [activeTab, setActiveTab] = useState<string>("Relationship Style");

  const optionsByCategory = useMemo(() => {
    const map = new Map<string, typeof options>();
    (options || []).forEach(opt => {
      const existing = map.get(opt.category) || [];
      existing.push(opt);
      map.set(opt.category, existing);
    });
    return map;
  }, [options]);

  const toggleFilter = (desireId: string) => {
    setFilters(prev => {
      const next = new Map(prev);
      if (!next.has(desireId)) {
        next.set(desireId, false); // nice to have
      } else if (!next.get(desireId)) {
        next.set(desireId, true); // must match
      } else {
        next.delete(desireId); // remove
      }
      return next;
    });
  };

  const handleApply = () => {
    const result: DesireFilter[] = [];
    filters.forEach((mustMatch, desireId) => {
      result.push({ desireId, mustMatch });
    });
    onApplyFilters(result);
    setOpen(false);
  };

  const handleClear = () => {
    setFilters(new Map());
    onApplyFilters([]);
    setOpen(false);
  };

  const filterCount = filters.size;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="h-4 w-4 mr-1" />
          Desires
          {filterCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {filterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter by Desires</SheetTitle>
        </SheetHeader>

        <p className="text-xs text-muted-foreground mt-1 mb-3">
          Tap once = nice to have • Tap twice = must match • Tap again = remove
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex overflow-x-auto gap-1 bg-transparent justify-start">
            {DESIRE_CATEGORIES.map(cat => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          {DESIRE_CATEGORIES.map(cat => (
            <TabsContent key={cat} value={cat} className="mt-3">
              <div className="flex flex-wrap gap-2">
                {(optionsByCategory.get(cat) || []).map(opt => {
                  const isSelected = filters.has(opt.id);
                  const isMust = filters.get(opt.id) === true;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleFilter(opt.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all min-h-[36px]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        isSelected
                          ? isMust
                            ? "bg-primary text-primary-foreground ring-2 ring-amber-400"
                            : cn(CATEGORY_COLORS[cat])
                          : "bg-muted/40 text-foreground border border-border hover:border-primary/50"
                      )}
                      aria-label={`${opt.label}${isMust ? " (must match)" : isSelected ? " (nice to have)" : ""}`}
                    >
                      {opt.emoji && <span>{opt.emoji}</span>}
                      {opt.label}
                      {isMust && <Star className="h-3 w-3 fill-current text-amber-300" />}
                    </button>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={handleClear} className="flex-1">
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
