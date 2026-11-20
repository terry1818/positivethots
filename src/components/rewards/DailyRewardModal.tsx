import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GuideArt } from "@/components/mascot/GuideArt";
import { CelebrationEngine, CelebrationTier } from "@/components/celebrations/CelebrationEngine";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/sessionStore";
import { rollDailyReward } from "@/lib/learnSmallFixes";
import { reportError } from "@/lib/errorReporting";
import { toast } from "sonner";
import type { XPAwardResult } from "@/lib/xpAward";

interface DailyRewardResult {
  xp: number;
  isBoost: boolean;
  tier: CelebrationTier;
}

export const DailyRewardModal = ({ reopenTrigger, onReadyChange }: { reopenTrigger: number; onReadyChange: (ready: boolean) => void }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [reward, setReward] = useState<DailyRewardResult | null>(null);
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setClaimed(false);
    setReward(null);
    onReadyChange(false);
    const checkDailyReward = async () => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("last_daily_reward_date")
        .eq("id", user.id)
        .single();

      const today = new Date().toISOString().split("T")[0];
      if (!active || error || !profile || profile.last_daily_reward_date === today) return;
      setReward(rollDailyReward(user.id, today));
      const session = useSessionStore.getState();
      if (!session.isBannerDismissed("daily_reward")) {
        session.dismissBanner("daily_reward");
        setIsOpen(true);
      } else {
        onReadyChange(true);
      }
    };
    void checkDailyReward().catch(() => {});
    return () => { active = false; };
  }, [user, onReadyChange]);

  useEffect(() => {
    if (reopenTrigger > 0 && reward && !claimed) {
      setIsOpen(true);
      onReadyChange(false);
    }
  }, [reopenTrigger]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      useSessionStore.getState().dismissBanner("daily_reward");
      onReadyChange(!claimed);
    }
  };

  const handleClaim = async () => {
    if (!user || !reward || claimed || claiming) return;
    setClaiming(true);

    const today = new Date().toISOString().split("T")[0];

    try {
      // Award XP if applicable
      let awarded = reward.xp;
      if (reward.xp > 0) {
        const { data, error } = await supabase.rpc("award_xp", {
          _user_id: user.id,
          _amount: reward.xp,
          _source: "daily_reward",
        });
        if (error) throw error;
        awarded = (data as unknown as XPAwardResult).awarded;
      }
      const { error: profileError } = await supabase.from("profiles").update({ last_daily_reward_date: today }).eq("id", user.id);
      if (profileError) throw profileError;
      setClaimed(true);
      onReadyChange(false);
      if (awarded > 0 || reward.isBoost) setCelebrationTrigger((c) => c + 1);
      setTimeout(() => setIsOpen(false), 1500);
    } catch (error) {
      void reportError(error instanceof Error ? error : new Error("Daily bonus failed"));
      toast.error("Could not save your XP. Please try again.");
    } finally {
      setClaiming(false);
    }
  };

  if (!reward) return null;

  return (
    <>
      <CelebrationEngine illustration={<GuideArt name="guide-high-five" size={160}/>} tier={reward.tier} trigger={celebrationTrigger} title={`+${reward.xp} XP`} />
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-sm border-0 p-0 overflow-hidden bg-gradient-to-br from-primary to-secondary">
          <div className="p-8 text-center space-y-4">
            <GuideArt name="guide-chest-open" size={160}/>
            <h2 className="text-2xl font-bold text-white">Welcome back! 🌟</h2>
            <p className="text-white/90">Here's your daily bonus!</p>

            <div className="bg-white/20 rounded-2xl p-6 backdrop-blur-sm">
              {reward.isBoost ? (
                <div className="text-center">
                  <span className="text-4xl">⚡</span>
                  <p className="text-white font-bold text-xl mt-2">2× XP Boost</p>
                  <p className="text-white/80 text-sm">Active for 15 minutes!</p>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-5xl font-bold text-white">+{reward.xp}</span>
                  <p className="text-white/80 text-sm mt-1">Bonus XP</p>
                </div>
              )}
            </div>

            <Button
              className={cn(
                "w-full bg-white text-primary hover:bg-white/90 font-semibold rounded-xl h-12",
                claimed && "opacity-60"
              )}
              onClick={handleClaim}
              disabled={claimed || claiming}
            >
              {claimed ? "Claimed! ✨" : "Claim Reward"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
