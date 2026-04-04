import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Zap, Star, Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MONTHLY_TIERS,
  ALL_FEATURES,
  FEATURE_LABELS,
} from "@/lib/subscriptionTiers";
import { useState } from "react";
import { toast } from "sonner";

interface PricingTier {
  user_segment: string;
  recommended_plan: string;
  trial_offer_days: number;
  discount_percentage: number;
  promo_message: string;
  trigger_event: string;
}

const planIcons = { plus: Zap, premium: Crown, vip: Star };

export const DynamicPaywall = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const { data: segment } = useQuery({
    queryKey: ["user-segment", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Determine segment client-side based on profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("created_at, last_active_at")
        .eq("id", user.id)
        .single();

      if (!profile) return { segment: "new_user" };

      const accountAge = (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24);
      const daysSinceLast = profile.last_active_at
        ? (Date.now() - new Date(profile.last_active_at).getTime()) / (1000 * 60 * 60 * 24)
        : 0;

      if (accountAge <= 7) return { segment: "new_user" };
      if (daysSinceLast > 14) return { segment: "lapsed" };
      return { segment: "active_free" };
    },
    enabled: !!user,
  });

  const { data: pricing } = useQuery({
    queryKey: ["pricing-tiers", segment?.segment],
    queryFn: async () => {
      if (!segment) return null;
      const { data, error } = await supabase
        .from("pricing_tiers")
        .select("*")
        .eq("user_segment", segment.segment)
        .eq("is_active", true)
        .limit(1)
        .single();
      if (error) return null;
      return data as PricingTier;
    },
    enabled: !!segment,
  });

  const handleSubscribe = async (priceId: string) => {
    setLoading(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { price_id: priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const recommendedPlan = pricing?.recommended_plan ?? "premium";

  return (
    <div className="space-y-4">
      {/* Personalized message */}
      {pricing?.promo_message && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-sm font-medium">{pricing.promo_message}</p>
            {pricing.trial_offer_days > 0 && (
              <Badge className="mt-2 bg-green-500/20 text-green-400">
                {pricing.trial_offer_days}-day free trial
              </Badge>
            )}
            {pricing.discount_percentage > 0 && (
              <Badge className="mt-2 bg-accent/20 text-accent ml-2">
                {pricing.discount_percentage}% off first month
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-3">
        {MONTHLY_TIERS.map((config) => {
          const Icon = planIcons[config.tier as keyof typeof planIcons];
          const isRecommended = config.tier === recommendedPlan;

          return (
            <Card
              key={config.tier}
              className={cn(
                "relative transition-all",
                isRecommended && "border-primary ring-2 ring-primary/20"
              )}
            >
              {isRecommended && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs">
                    Recommended for you
                  </Badge>
                </div>
              )}
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold">{config.name}</p>
                      <p className="text-sm">
                        <span className="font-bold">${config.price}</span>
                        <span className="text-muted-foreground">/mo</span>
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleSubscribe(config.priceId)}
                    disabled={loading !== null}
                    size="sm"
                    variant={isRecommended ? "default" : "outline"}
                  >
                    {loading === config.priceId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      `Get ${config.name}`
                    )}
                  </Button>
                </div>

                {isRecommended && (
                  <div className="mt-3 grid grid-cols-2 gap-1">
                    {config.features.slice(0, 4).map((f) => (
                      <div key={f} className="flex items-center gap-1 text-xs">
                        <Check className="h-3 w-3 text-primary" />
                        <span>{FEATURE_LABELS[f]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
