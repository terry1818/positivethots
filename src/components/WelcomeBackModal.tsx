import { GuideArt } from "@/components/mascot/GuideArt";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, BookOpen, Gift, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { reportError } from "@/lib/errorReporting";
import type { XPAwardResult } from "@/lib/xpAward";

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
        const { data: result, error } = await supabase.rpc("award_xp", {
          _user_id: user.id,
          _amount: 50,
          _source: "winback_bonus",
          _source_id: "welcome_back",
        });
        if (error) {
          void reportError(new Error(error.message));
          toast({ title: "Could not save your XP. Please try again.", variant: "destructive" });
        } else if (result) setXpGranted((result as unknown as XPAwardResult).awarded > 0);
      }

      setOpen(true);
    };

    loadStats();
  }, [previousChurnStatus, user]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm text-center kit-area-learn">
        <div className="pt-2 space-y-4">
          <div className="kit-panel kit-rise h-[168px]">
            <GuideArt name="guide-waving" size={156} />
          </div>

          <div className="kit-rise" style={{ "--i": 1 } as CSSProperties}>
            <DialogTitle className="text-2xl font-extrabold">Welcome Back! 💜</DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1 text-sm">Here's where things stand:</DialogDescription>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="kit-stat kit-pop" style={{ "--i": 2 } as CSSProperties}>
              <span className="kit-coin" data-tone="pink"><Heart aria-hidden="true" /></span>
              <span className="kit-stat-value">{stats.newMatches}</span>
              <span className="kit-stat-label">Connections</span>
            </div>
            <div className="kit-stat kit-pop" style={{ "--i": 3 } as CSSProperties}>
              <span className="kit-coin" data-tone="info"><BookOpen aria-hidden="true" /></span>
              <span className="kit-stat-value">{stats.newModules}</span>
              <span className="kit-stat-label">Courses</span>
            </div>
            <div className="kit-stat kit-pop" style={{ "--i": 4 } as CSSProperties}>
              <span className="kit-coin" data-tone="urgent"><Flame aria-hidden="true" /></span>
              <span className="kit-stat-value">{stats.streak}</span>
              <span className="kit-stat-label">Day streak</span>
            </div>
          </div>

          {xpGranted && (
            <div className="kit-row kit-pop justify-center !min-h-[48px]" style={{ "--i": 5 } as CSSProperties}>
              <span className="kit-coin" data-tone="reward"><Gift aria-hidden="true" /></span>
              <span className="font-extrabold">+50 XP Welcome Back Bonus!</span>
            </div>
          )}

          <Button onClick={() => setOpen(false)} className="kit-cta w-full">
            Let's Go!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
