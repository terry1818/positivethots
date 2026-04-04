import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Users, Clock, PartyPopper } from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  goal_target: number;
  current_progress: number;
  reward_description: string;
  reward_icon: string | null;
  ends_at: string;
  completed: boolean;
}

export const CommunityChallengeCard = () => {
  const reducedMotion = useReducedMotion();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("community_challenges")
        .select("*")
        .eq("is_active", true)
        .order("ends_at", { ascending: true })
        .limit(1);

      if (data && data.length > 0) setChallenge(data[0] as Challenge);
      setLoading(false);
    };
    load();

    // Realtime updates
    const channel = supabase
      .channel("community-challenges")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "community_challenges",
      }, (payload) => {
        const updated = payload.new as Challenge;
        setChallenge((prev) => (prev && prev.id === updated.id ? updated : prev));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading || !challenge) return null;

  const percent = Math.min(100, Math.round((challenge.current_progress / challenge.goal_target) * 100));
  const daysLeft = Math.max(0, Math.ceil((new Date(challenge.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <Card className={cn(
      "border transition-colors",
      challenge.completed ? "border-green-500/40 bg-green-500/5" : "border-border"
    )}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Community Goal</span>
          </div>
          {challenge.completed ? (
            <span className="flex items-center gap-1 text-green-400 text-xs font-medium">
              <PartyPopper className="h-3.5 w-3.5" /> Complete!
            </span>
          ) : (
            <span className="flex items-center gap-1 text-muted-foreground text-xs">
              <Clock className="h-3 w-3" /> {daysLeft}d left
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground">{challenge.title}</p>

        <div className="space-y-1">
          <Progress value={percent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{challenge.current_progress.toLocaleString()} / {challenge.goal_target.toLocaleString()}</span>
            <span>{percent}%</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {challenge.reward_icon} Reward: {challenge.reward_description}
        </p>
      </CardContent>
    </Card>
  );
};
