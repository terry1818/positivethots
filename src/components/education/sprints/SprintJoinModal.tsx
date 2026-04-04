import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MascotReaction } from "@/components/mascot/MascotReaction";
import { Trophy, TrendingUp, Zap } from "lucide-react";

interface SprintJoinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SprintJoinModal = ({ open, onOpenChange }: SprintJoinModalProps) => {
  const { user } = useAuth();
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!user) return;
    setJoining(true);

    // Find active sprint
    const { data: sprints } = await supabase
      .from("weekly_sprints")
      .select("*")
      .eq("is_active", true)
      .order("week_start", { ascending: false })
      .limit(1);

    if (!sprints || sprints.length === 0) {
      setJoining(false);
      onOpenChange(false);
      return;
    }

    await supabase.from("sprint_participants").upsert({
      sprint_id: sprints[0].id,
      user_id: user.id,
      xp_earned: 0,
      lessons_completed: 0,
      scenarios_completed: 0,
    }, { onConflict: "sprint_id,user_id" });

    setJoining(false);
    onOpenChange(false);
    window.location.reload(); // Refresh to show banner
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Ready to compete? 🏆</DialogTitle>
          <DialogDescription className="text-center">
            Join this week's sprint and compete with other learners!
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-2">
          <MascotReaction emotion="excited" size="medium" position="inline" />
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <TrendingUp className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Top 5 get promoted</p>
              <p className="text-muted-foreground">Move up to a higher league! 🚀</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Earn XP to climb</p>
              <p className="text-muted-foreground">Quizzes, scenarios, and badges all count</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Button onClick={handleJoin} disabled={joining} className="w-full rounded-xl" size="lg">
            {joining ? "Joining…" : "Join Sprint"}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full text-muted-foreground">
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
