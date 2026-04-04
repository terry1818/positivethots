import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Trophy, Clock } from "lucide-react";

interface Participant {
  user_id: string;
  xp_earned: number;
  rank: number | null;
  lessons_completed: number;
  scenarios_completed: number;
  promotion_zone: boolean;
  demotion_zone: boolean;
  display_name?: string;
}

interface SprintLeaderboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprintId: string;
  leagueTier: string;
  weekEnd: string;
}

const RANK_ICONS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export const SprintLeaderboard = ({
  open,
  onOpenChange,
  sprintId,
  leagueTier,
  weekEnd,
}: SprintLeaderboardProps) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("sprint_participants")
        .select("*")
        .eq("sprint_id", sprintId)
        .order("xp_earned", { ascending: false });

      if (data) {
        // Fetch display names
        const userIds = data.map((p) => p.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, name")
          .in("id", userIds);

        const nameMap = new Map(profiles?.map((p) => [p.id, p.display_name || p.name]) ?? []);

        setParticipants(
          data.map((p, i) => ({
            ...p,
            rank: i + 1,
            display_name: nameMap.get(p.user_id) ?? "Learner",
          }))
        );
      }
      setLoading(false);
    };
    load();

    // Realtime
    const channel = supabase
      .channel(`sprint-${sprintId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "sprint_participants",
        filter: `sprint_id=eq.${sprintId}`,
      }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [open, sprintId]);

  const daysLeft = Math.max(0, Math.ceil((new Date(weekEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const total = participants.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              This Week's Sprint
            </DialogTitle>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{daysLeft}d left</span>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))
          ) : (
            participants.map((p) => {
              const isCurrentUser = p.user_id === user?.id;
              const isPromotion = p.rank != null && p.rank <= 5;
              const isDemotion = p.rank != null && total > 5 && p.rank > total - 5;

              return (
                <div
                  key={p.user_id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isCurrentUser && "bg-primary/10 ring-1 ring-primary/30",
                    !isCurrentUser && isPromotion && "bg-green-500/5",
                    !isCurrentUser && isDemotion && "bg-red-500/5"
                  )}
                >
                  {/* Rank */}
                  <div className="w-8 text-center flex-shrink-0">
                    {p.rank && RANK_ICONS[p.rank] ? (
                      <span className="text-lg">{RANK_ICONS[p.rank]}</span>
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">#{p.rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                    isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {(p.display_name || "?")[0].toUpperCase()}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <span className={cn("text-sm truncate block", isCurrentUser && "font-semibold text-foreground")}>
                      {p.display_name}
                      {isCurrentUser && <span className="text-primary ml-1">(You)</span>}
                    </span>
                  </div>

                  {/* XP */}
                  <span className="text-sm font-semibold text-foreground flex-shrink-0">
                    {p.xp_earned.toLocaleString()} XP
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Legend */}
        <div className="px-4 py-2 border-t border-border flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" /> Promotion
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Demotion
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
