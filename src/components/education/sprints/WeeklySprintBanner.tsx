import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Trophy, TrendingUp, TrendingDown, Clock, ChevronRight } from "lucide-react";
import { SprintLeaderboard } from "./SprintLeaderboard";
import { SprintJoinModal } from "./SprintJoinModal";

const LEAGUE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  bronze: { label: "Bronze", color: "bg-amber-800/30 text-amber-400 border-amber-700/50", icon: "🥉" },
  silver: { label: "Silver", color: "bg-gray-400/20 text-gray-300 border-gray-500/50", icon: "🥈" },
  gold: { label: "Gold", color: "bg-yellow-500/20 text-yellow-400 border-yellow-600/50", icon: "🥇" },
  diamond: { label: "Diamond", color: "bg-cyan-400/20 text-cyan-300 border-cyan-500/50", icon: "💎" },
  champion: { label: "Champion", color: "bg-purple-500/20 text-purple-300 border-purple-500/50", icon: "👑" },
};

interface SprintData {
  sprintId: string;
  leagueTier: string;
  rank: number | null;
  xpEarned: number;
  totalParticipants: number;
  daysLeft: number;
  promotionZone: boolean;
  demotionZone: boolean;
  weekEnd: string;
}

export const WeeklySprintBanner = () => {
  const { user } = useAuth();
  const [data, setData] = useState<SprintData | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notJoined, setNotJoined] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Get active sprint
      const { data: sprints } = await supabase
        .from("weekly_sprints")
        .select("*")
        .eq("is_active", true)
        .order("week_start", { ascending: false })
        .limit(1);

      if (!sprints || sprints.length === 0) {
        setLoading(false);
        return;
      }

      const sprint = sprints[0];

      // Get user participation
      const { data: participation } = await supabase
        .from("sprint_participants")
        .select("*")
        .eq("sprint_id", sprint.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!participation) {
        setNotJoined(true);
        setShowJoin(true);
        setLoading(false);
        return;
      }

      // Get total participants
      const { count } = await supabase
        .from("sprint_participants")
        .select("*", { count: "exact", head: true })
        .eq("sprint_id", sprint.id);

      const weekEnd = new Date(sprint.week_end);
      const now = new Date();
      const daysLeft = Math.max(0, Math.ceil((weekEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      setData({
        sprintId: sprint.id,
        leagueTier: sprint.league_tier,
        rank: participation.rank,
        xpEarned: participation.xp_earned,
        totalParticipants: count ?? 0,
        daysLeft,
        promotionZone: participation.promotion_zone,
        demotionZone: participation.demotion_zone,
        weekEnd: sprint.week_end,
      });
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading || (!data && !notJoined)) return null;

  if (notJoined) {
    return (
      <>
        <Card
          className="cursor-pointer border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
          onClick={() => setShowJoin(true)}
        >
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Join this week's sprint!</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <SprintJoinModal open={showJoin} onOpenChange={setShowJoin} />
      </>
    );
  }

  if (!data) return null;

  const league = LEAGUE_CONFIG[data.leagueTier] || LEAGUE_CONFIG.bronze;

  return (
    <>
      <Card
        className={cn(
          "cursor-pointer border transition-colors",
          data.promotionZone && "border-green-500/40 bg-green-500/5",
          data.demotionZone && "border-red-500/40 bg-red-500/5",
          !data.promotionZone && !data.demotionZone && "border-border"
        )}
        onClick={() => setShowLeaderboard(true)}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{league.icon}</span>
              <Badge variant="outline" className={cn("text-xs", league.color)}>
                {league.label} League
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-foreground">
                #{data.rank ?? "–"} <span className="text-muted-foreground font-normal">of {data.totalParticipants}</span>
              </span>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{data.daysLeft}d</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{data.xpEarned.toLocaleString()} XP this week</span>
            {data.promotionZone && (
              <span className="flex items-center gap-0.5 text-green-400 text-xs font-medium">
                <TrendingUp className="h-3 w-3" /> Promotion zone
              </span>
            )}
            {data.demotionZone && (
              <span className="flex items-center gap-0.5 text-red-400 text-xs font-medium">
                <TrendingDown className="h-3 w-3" /> Demotion zone
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {data.sprintId && (
        <SprintLeaderboard
          open={showLeaderboard}
          onOpenChange={setShowLeaderboard}
          sprintId={data.sprintId}
          leagueTier={data.leagueTier}
          weekEnd={data.weekEnd}
        />
      )}
    </>
  );
};
