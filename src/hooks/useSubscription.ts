import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  type SubscriptionTier,
  type FeatureKey,
  getTierByProductId,
  tierHasFeature,
} from "@/lib/subscriptionTiers";

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
