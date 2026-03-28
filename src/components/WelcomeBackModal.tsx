import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, BookOpen, Gift, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface WelcomeBackModalProps {
  previousChurnStatus: string | null;
}

export const WelcomeBackModal = ({ previousChurnStatus }: WelcomeBackModalProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState({ newMatches: 0, newModules: 0, streak: 0 });
  const [xpGranted, setXpGranted] = useState(false);

  useEffect(() => {
    if (!previousChurnStatus || !user) return;

    const loadStats = async () => {
      // Count new matches since last active
      const { count: matchCount } = await supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      // Get streak
      const { data: learning } = await supabase
        .from("user_learning_stats")
        .select("current_streak")
        .eq("user_id", user.id)
        .maybeSingle();

      // Count modules
      const { count: moduleCount } = await supabase
        .from("education_modules")
        .select("id", { count: "exact", head: true });

      setStats({
        newMatches: matchCount || 0,
        newModules: moduleCount || 0,
        streak: learning?.current_streak || 0,
      });

      // Check if eligible for winback XP
      const { data: profile } = await supabase
        .from("profiles")
        .select("last_winback_sent_at")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.last_winback_sent_at) {
        // Grant 50 bonus XP
        const { data: result } = await supabase.rpc("award_xp", {
          _user_id: user.id,
          _amount: 50,
          _source: "winback_bonus",
          _source_id: "welcome_back",
        });
        if (result) {
          setXpGranted(true);
        }
      }

      setOpen(true);
    };

    loadStats();
  }, [previousChurnStatus, user]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm text-center">
        <div className="py-4 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-bounce-in">
            <Heart className="h-8 w-8 text-primary fill-primary" />
          </div>

          <div>
            <h2 className="text-2xl font-bold">Welcome Back! 💜</h2>
            <p className="text-muted-foreground mt-1 text-sm">Here's what you missed:</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-muted rounded-lg p-3">
              <Heart className="h-5 w-5 mx-auto text-secondary mb-1" />
              <p className="text-lg font-bold">{stats.newMatches}</p>
              <p className="text-[10px] text-muted-foreground">Matches</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <BookOpen className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold">{stats.newModules}</p>
              <p className="text-[10px] text-muted-foreground">Courses</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <Flame className="h-5 w-5 mx-auto text-destructive mb-1" />
              <p className="text-lg font-bold">{stats.streak}</p>
              <p className="text-[10px] text-muted-foreground">Streak</p>
            </div>
          </div>

          {xpGranted && (
            <div className="bg-primary/10 rounded-lg p-3 flex items-center gap-2 justify-center animate-slide-up">
              <Gift className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-primary">+50 XP Welcome Back Bonus!</span>
            </div>
          )}

          <Button onClick={() => setOpen(false)} className="w-full">
            Let's Go!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
