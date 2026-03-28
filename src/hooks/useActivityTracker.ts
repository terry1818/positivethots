import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Tracks user activity by updating last_active_at on mount
 * and every 5 minutes while the tab is active.
 * Also detects returning churned users and returns their previous churn status.
 */
export function useActivityTracker() {
  const { user } = useAuth();
  const lastUpdate = useRef(0);
  const previousChurnStatus = useRef<string | null>(null);
  const checkedReturn = useRef(false);

  useEffect(() => {
    if (!user) return;

    const updateActivity = async () => {
      const now = Date.now();
      // Throttle: max once per 5 minutes
      if (now - lastUpdate.current < 5 * 60 * 1000) return;
      lastUpdate.current = now;

      // Check current churn status before updating (for welcome-back detection)
      if (!checkedReturn.current) {
        checkedReturn.current = true;
        const { data: profile } = await supabase
          .from("profiles")
          .select("churn_status, last_winback_sent_at")
          .eq("id", user.id)
          .maybeSingle();

        if (profile && (profile.churn_status === "inactive" || profile.churn_status === "churned")) {
          previousChurnStatus.current = profile.churn_status;
        }
      }

      await supabase
        .from("profiles")
        .update({
          last_active_at: new Date().toISOString(),
          churn_status: "active",
          // Reset winback_attempts on return
          winback_attempts: 0,
        })
        .eq("id", user.id);
    };

    updateActivity();

    // Update on visibility change (returning to tab)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        updateActivity();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Periodic update every 5 min
    const interval = setInterval(updateActivity, 5 * 60 * 1000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, [user]);

  return {
    /** Non-null if user was inactive/churned before this session */
    previousChurnStatus: previousChurnStatus.current,
  };
}
