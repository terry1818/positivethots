import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MascotReaction } from "@/components/mascot/MascotReaction";
import { CelebrationEngine, CelebrationTier } from "@/components/celebrations/CelebrationEngine";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface DailyRewardResult {
  xp: number;
  isBoost: boolean;
  tier: CelebrationTier;
}

function rollReward(): DailyRewardResult {
  const r = Math.random();
  if (r < 0.6) return { xp: 5, isBoost: false, tier: "micro" };
  if (r < 0.8) return { xp: 10, isBoost: false, tier: "micro" };
  if (r < 0.9) return { xp: 15, isBoost: false, tier: "small" };
  if (r < 0.95) return { xp: 25, isBoost: false, tier: "small" };
  return { xp: 0, isBoost: true, tier: "medium" };
}

export const DailyRewardModal = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [reward, setReward] = useState<DailyRewardResult | null>(null);
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (!user) return;
    checkDailyReward();
  }, [user]);

  const checkDailyReward = async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("last_daily_reward_date")
        .eq("id", user.id)
        .single();

      const today = new Date().toISOString().split("T")[0];
      if (profile?.last_daily_reward_date === today) return;

      const r = rollReward();
      setReward(r);
      setIsOpen(true);
    } catch {
      // Silently fail — non-critical feature
    }
  };

  const handleClaim = async () => {
    if (!user || !reward || claimed) return;
    setClaimed(true);

    const today = new Date().toISOString().split("T")[0];

    try {
      // Update last reward date
      await supabase
        .from("profiles")
        .update({ last_daily_reward_date: today } as any)
        .eq("id", user.id);

      // Award XP if applicable
      if (reward.xp > 0) {
        await supabase.rpc("award_xp", {
          _user_id: user.id,
          _amount: reward.xp,
          _source: "daily_reward",
        });
      }

      setCelebrationTrigger((c) => c + 1);
    } catch {
      // Silently fail
    }

    setTimeout(() => setIsOpen(false), 1500);
  };

  if (!reward) return null;

  return (
    <>
      <CelebrationEngine tier={reward.tier} trigger={celebrationTrigger} title={`+${reward.xp} XP`} />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-sm border-0 p-0 overflow-hidden bg-gradient-to-br from-primary to-secondary">
          <div className="p-8 text-center space-y-4">
            <MascotReaction emotion="waving" size="large" position="inline" />
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
              disabled={claimed}
            >
              {claimed ? "Claimed! ✨" : "Claim Reward"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
