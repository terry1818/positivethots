import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { isMissingFunction } from "@/lib/dailySpin";

/** 999 is how the server says "unlimited". */
const UNLIMITED = 999;
type Rpc = (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>;

export const useSuperLikes = () => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const { hasFeature } = useSubscription();

  // What the plan shows. The number that counts is the server's: it works the allowance out from the
  // member's plan (free 1 a day, Plus and Premium 5, VIP unlimited) and ignores what is sent here.
  const planUnlimited = hasFeature("unlimited_super_likes");
  const dailyLimit = hasFeature("super_likes") ? 5 : 1;
  const isUnlimited = planUnlimited || balance >= UNLIMITED;

  const refreshBalance = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

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
  }, [dailyLimit]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const sendSuperLike = useCallback(async (receiverId: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      if (!isUnlimited && balance <= 0) return false;

      // One server call spends the Thot and records it together.
      const { data: left, error } = await (supabase.rpc as unknown as Rpc)("send_thot", { _receiver_id: receiverId });
      if (error && isMissingFunction(error)) {
        // The database is older than this app: send it the old way, in two steps.
        const { error: slError } = await supabase.from("super_likes").insert({
          sender_id: session.user.id,
          receiver_id: receiverId,
        });
        if (slError) throw slError;
        if (!isUnlimited) {
          const { data: newBalance, error: balError } = await supabase
            .rpc("decrement_super_like", { _user_id: session.user.id });
          if (balError) throw balError;
          setBalance(newBalance ?? balance - 1);
        }
      } else if (error) {
        throw error;
      } else {
        setBalance(typeof left === "number" ? left : Math.max(0, balance - 1));
      }

      // Also a Connect, so it counts toward "You Both Said Yes"
      await supabase.from("swipes").insert({
        swiper_id: session.user.id,
        swiped_id: receiverId,
        direction: "right",
      });

      return true;
    } catch (err) {
      console.error("Error sending super like:", err);
      return false;
    }
  }, [balance, isUnlimited]);

  return { balance, isUnlimited, loading, sendSuperLike, refreshBalance, canSuperLike: dailyLimit > 0 || isUnlimited };
};
