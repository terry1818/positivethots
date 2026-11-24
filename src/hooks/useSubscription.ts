import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  type SubscriptionTier,
  type FeatureKey,
  getTierByProductId,
  tierHasFeature,
} from "@/lib/subscriptionTiers";

type PlanRow = { plan: string | null; status: string | null; current_period_end: string | null };
const PLAN_RANK: Record<string, number> = { plus: 1, premium: 2, vip: 3 };

/** The member's best plan that is active and not past its end date: the same rule the server uses. */
export function pickActivePlan(rows: PlanRow[], now = Date.now()): { plan: SubscriptionTier; current_period_end: string | null } | null {
  const live = rows
    .filter((r) => r.status === "active" && !!r.plan && r.plan in PLAN_RANK)
    .filter((r) => !r.current_period_end || new Date(r.current_period_end).getTime() > now)
    .sort((a, b) => PLAN_RANK[b.plan as string] - PLAN_RANK[a.plan as string]);
  return live.length ? { plan: live[0].plan as SubscriptionTier, current_period_end: live[0].current_period_end } : null;
}

export const useSubscription = () => {
  const [isPremium, setIsPremium] = useState(false);
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [loading, setLoading] = useState(true);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsPremium(false);
        setTier("free");
        setLoading(false);
        return;
      }

      // The `subscriptions` table is what the server goes by (Thots a day, who sees their Connects),
      // so the app reads the member's own row first and shows the same plan the server grants.
      const { data: rows } = await supabase
        .from("subscriptions")
        .select("plan, status, current_period_end")
        .eq("user_id", session.user.id)
        .eq("status", "active");
      const live = pickActivePlan((rows ?? []) as PlanRow[]);
      if (live) {
        setIsPremium(true);
        setTier(live.plan);
        setSubscriptionEnd(live.current_period_end);
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      const subscribed = data?.subscribed ?? false;
      setIsPremium(subscribed);
      setSubscriptionEnd(data?.subscription_end ?? null);

      if (subscribed && data?.product_id) {
        setTier(getTierByProductId(data.product_id));
      } else {
        setTier("free");
      }
    } catch (err) {
      console.error("Error checking subscription:", err);
      setIsPremium(false);
      setTier("free");
    } finally {
      setLoading(false);
    }
  }, []);

  const hasFeature = useCallback(
    (feature: FeatureKey) => tierHasFeature(tier, feature),
    [tier]
  );

  useEffect(() => {
    checkSubscription();

    // Use realtime instead of polling for subscription changes
    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions' },
        () => { checkSubscription(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [checkSubscription]);

  return { isPremium, tier, loading, subscriptionEnd, hasFeature, refetch: checkSubscription };
};
