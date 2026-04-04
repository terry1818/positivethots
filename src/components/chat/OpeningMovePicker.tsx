import { useState, useMemo } from "react";
import { useOpeningMoves, type OpeningMove } from "@/hooks/useOpeningMoves";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, Check, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OpeningMovePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (move: OpeningMove) => void;
  onSkip: () => void;
  userTier?: number;
  userBadgeSlugs?: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  icebreaker: "Icebreaker",
  deep_dive: "Deep Dive",
  education: "Education",
  playful: "Playful",
  boundary: "Boundary",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  icebreaker: "🧊",
  deep_dive: "🤿",
  education: "📚",
  playful: "🎲",
  boundary: "🛡️",
};

export const OpeningMovePicker = ({
  open, onOpenChange, onSelect, onSkip, userTier = 0, userBadgeSlugs = [],
}: OpeningMovePickerProps) => {
  const { data: moves, isLoading } = useOpeningMoves(userTier);
  const [tab, setTab] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredMoves = useMemo(() => {
    if (!moves) return [];
    if (tab === "all") return moves;
    return moves.filter(m => m.category === tab);
  }, [moves, tab]);

  const isUnlocked = (move: OpeningMove) => {
    if (move.requires_education_tier > userTier) return false;
    if (move.related_badge_slug && !userBadgeSlugs.includes(move.related_badge_slug)) return false;
    return true;
  };

  const handleSelect = () => {
    const move = moves?.find(m => m.id === selectedId);
    if (move) {
      onSelect(move);
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Start with an Opening Move
          </SheetTitle>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-3">
          <TabsList className="w-full flex overflow-x-auto gap-1 bg-transparent justify-start">
            <TabsTrigger value="all" className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              All
            </TabsTrigger>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <TabsTrigger key={key} value={key} className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {CATEGORY_EMOJIS[key]} {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-3 space-y-2">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))
            ) : filteredMoves.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No opening moves in this category yet
              </p>
            ) : (
              filteredMoves.map(move => {
                const unlocked = isUnlocked(move);
                const isSelected = selectedId === move.id;

                return (
                  <button
                    key={move.id}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => setSelectedId(isSelected ? null : move.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all min-h-[44px]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      !unlocked && "opacity-50 cursor-not-allowed",
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg shrink-0">{CATEGORY_EMOJIS[move.category]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{move.text}</p>
                        {move.context_note && (
                          <p className="text-xs text-muted-foreground mt-1">{move.context_note}</p>
                        )}
                        {move.related_badge_slug && unlocked && (
                          <Badge variant="outline" className="text-[10px] mt-1 gap-1">
                            📚 Inspired by {move.related_badge_slug.replace(/-/g, " ")}
                          </Badge>
                        )}
                      </div>
                      {!unlocked && <Lock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />}
                      {isSelected && <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Tabs>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={() => { onSkip(); onOpenChange(false); }}>
            Write my own
          </Button>
          <Button className="flex-1" disabled={!selectedId} onClick={handleSelect}>
            Use This Move
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
