import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShimmerButton } from "@/components/ShimmerButton";
import { StaggerChildren } from "@/components/StaggerChildren";
import {
  Crown,
  Heart,
  Eye,
  Zap,
  ArrowLeft,
  Loader2,
  Check,
  X,
  Star,
  Shield,
  Gift,
  Ticket,
} from "lucide-react";
import {
  SUBSCRIPTION_TIERS,
  ALL_FEATURES,
  FEATURE_LABELS,
  type FeatureKey,
} from "@/lib/subscriptionTiers";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const tierIcons = {
  plus: Zap,
  premium: Crown,
  vip: Star,
};

const Premium = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isPremium, tier: currentTier } = useSubscription();
  const [loading, setLoading] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [redeemingCode, setRedeemingCode] = useState(false);

  // Pre-fill from sessionStorage (referral flow)
  useEffect(() => {
    const refCode = sessionStorage.getItem("referralCode");
    if (refCode) {
      setPromoCode(refCode);
      sessionStorage.removeItem("referralCode");
    }
  }, []);

  // Show success toast if redirected after redemption
  useEffect(() => {
    if (searchParams.get("redeemed") === "true") {
      toast.success("Your trial has started! Welcome aboard 🎉");
    }
  }, [searchParams]);

  const handleSubscribe = async (priceId: string) => {
    setLoading(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { price_id: priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoading(null);
    }
  };

  const handleRedeemCode = async () => {
    if (!promoCode.trim()) return;
    setRedeemingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke("redeem-promo-code", {
        body: { code: promoCode.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        toast.success("Code accepted! Redirecting to checkout…");
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to redeem code");
    } finally {
      setRedeemingCode(false);
    }
  };

  if (isPremium) {
    const currentConfig = SUBSCRIPTION_TIERS.find((t) => t.tier === currentTier);
    const TierIcon = tierIcons[currentTier as keyof typeof tierIcons] ?? Crown;

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-blob-float" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-secondary/15 blur-3xl animate-blob-float [animation-delay:5s]" />
        <div className="animate-bounce-in relative z-10 text-center">
          <TierIcon className="h-16 w-16 text-primary mb-4 mx-auto animate-pulse-glow" />
          <h1 className="text-2xl font-bold mb-2">You're {currentConfig?.name ?? "Premium"}!</h1>
          <p className="text-muted-foreground mb-6">You have full access to your plan's features.</p>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/likes")}>View Your Likes</Button>
            <Button variant="outline" onClick={() => navigate("/settings")}>
              Manage Plan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-blob-float" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-secondary/15 blur-3xl animate-blob-float [animation-delay:5s]" />

      <div className="container max-w-4xl mx-auto px-4 py-6 relative z-10">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Crown className="h-8 w-8 text-primary animate-wiggle" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground">Unlock the full experience</p>
        </div>

        {/* Promo Code Section */}
        <Card className="mb-6 animate-fade-in border-dashed border-primary/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="h-5 w-5 text-primary" />
              <span className="font-medium">Have a promo or referral code?</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                maxLength={12}
                className="font-mono tracking-wider uppercase"
              />
              <Button
                onClick={handleRedeemCode}
                disabled={redeemingCode || !promoCode.trim()}
              >
                {redeemingCode ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Redeem"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Free Tier */}
        <Card className="mb-6 animate-fade-in border-muted">
          <CardHeader className="text-center pb-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mx-auto mb-2">
              <Heart className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">Free</CardTitle>
            <div className="mt-2">
              <span className="text-3xl font-bold">$0</span>
              <span className="text-muted-foreground text-sm">/forever</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2 mb-4">
              {["Browse profiles", "1 daily Super Like", "Education access", "Real-time chat", "Basic matching"].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {!currentTier || currentTier === "free" ? (
              <Badge className="w-full justify-center py-1.5" variant="secondary">Current Plan</Badge>
            ) : null}
          </CardContent>
        </Card>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" stagger={100}>
          {SUBSCRIPTION_TIERS.map((config) => {
            const Icon = tierIcons[config.tier as keyof typeof tierIcons];
            const isHighlighted = config.highlight;

            return (
              <Card
                key={config.tier}
                className={cn(
                  "relative transition-all hover:-translate-y-1",
                  isHighlighted && "border-primary shadow-lg ring-2 ring-primary/20"
                )}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{config.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${config.price}</span>
                    <span className="text-muted-foreground text-sm">/mo</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2 mb-6">
                    {ALL_FEATURES.map((feature) => {
                      const has = config.features.includes(feature);
                      return (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          {has ? (
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                          )}
                          <span className={cn(!has && "text-muted-foreground/40")}>
                            {FEATURE_LABELS[feature]}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <ShimmerButton
                    className={cn(
                      "w-full",
                      isHighlighted
                        ? "bg-gradient-to-r from-primary to-secondary"
                        : "bg-primary"
                    )}
                    onClick={() => handleSubscribe(config.priceId)}
                    disabled={loading !== null}
                  >
                    {loading === config.priceId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      `Get ${config.name}`
                    )}
                  </ShimmerButton>
                </CardContent>
              </Card>
            );
          })}
        </StaggerChildren>

        <p className="text-center text-xs text-muted-foreground">
          Cancel anytime · Billed monthly · Secure checkout via Stripe
        </p>
      </div>
    </div>
  );
};

export default Premium;
