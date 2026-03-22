import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

export const useSuperLikes = () => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const { tier, hasFeature } = useSubscription();

  const isUnlimited = hasFeature("unlimited_super_likes");
  const dailyLimit = hasFeature("super_likes") ? 5 : 0;

  const refreshBalance = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (isUnlimited) {
        setBalance(999);
        setLoading(false);
        return;
      }

      if (dailyLimit === 0) {
        setBalance(0);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc("refresh_daily_super_likes", {
        _user_id: session.user.id,
        _daily_limit: dailyLimit,
      });

      if (error) throw error;
      setBalance(data ?? 0);
    } catch (err) {
      console.error("Error refreshing super likes:", err);
    } finally {
      setLoading(false);
    }
  }, [isUnlimited, dailyLimit]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const sendSuperLike = useCallback(async (receiverId: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      if (!isUnlimited && balance <= 0) return false;

      // Insert super like
      const { error: slError } = await supabase.from("super_likes").insert({
        sender_id: session.user.id,
        receiver_id: receiverId,
      });
      if (slError) throw slError;

      // Insert as a "super" swipe so it counts toward matching
      await supabase.from("swipes").insert({
        swiper_id: session.user.id,
        swiped_id: receiverId,
        direction: "right",
      });

      // Decrement balance if not unlimited
      if (!isUnlimited) {
        const { data: newBalance, error: balError } = await supabase
          .rpc("decrement_super_like", { _user_id: session.user.id });
        if (balError) throw balError;
        setBalance(newBalance ?? balance - 1);
      }

      return true;
    } catch (err) {
      console.error("Error sending super like:", err);
      return false;
    }
  }, [balance, isUnlimited]);

  return { balance, isUnlimited, loading, sendSuperLike, refreshBalance, canSuperLike: dailyLimit > 0 || isUnlimited };
};
