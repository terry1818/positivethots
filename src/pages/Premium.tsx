import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShimmerButton } from "@/components/ShimmerButton";
import { StaggerChildren } from "@/components/StaggerChildren";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Crown,
  Heart,
  Zap,
  ArrowLeft,
  Loader2,
  Check,
  X,
  Star,
  Gift,
  Send,
  Coins,
} from "lucide-react";
import {
  MONTHLY_TIERS,
  ANNUAL_TIERS,
  ALL_FEATURES,
  FEATURE_LABELS,
  type FeatureKey,
} from "@/lib/subscriptionTiers";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { CoinBalanceWidget } from "@/components/coins/CoinBalanceWidget";
import { GroupPricingCard } from "@/components/coins/GroupPricingCard";
import { usePartnerLinks } from "@/hooks/usePartnerLinks";
const tierIcons = {
  plus: Zap,
  premium: Crown,
  vip: Star,
};

const Premium = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isPremium, tier: currentTier } = useSubscription();
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [redeemingCode, setRedeemingCode] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const reducedMotion = useReducedMotion();

  // Gift state
  const [giftEmail, setGiftEmail] = useState("");
  const [giftTier, setGiftTier] = useState("premium");
  const [giftDays, setGiftDays] = useState("14");
  const [sendingGift, setSendingGift] = useState(false);

  // Pre-fill from session store (referral flow)
  useEffect(() => {
    const { useSessionStore } = require("@/stores/sessionStore") as any;
    const refCode = useSessionStore.getState().referralCode;
    if (refCode) {
      setPromoCode(refCode);
      useSessionStore.getState().setReferralCode(null);
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
      toast.error("Something went wrong. Please try again.");
    } finally {
      setRedeemingCode(false);
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  };

  const handleSendGift = async () => {
    if (!giftEmail.trim() || !user) return;
    setSendingGift(true);
    try {
      const code = generateCode();
      const { error } = await supabase.from("promo_codes").insert({
        code,
        type: "gift",
        tier: giftTier,
        trial_days: parseInt(giftDays),
        created_by: user.id,
      });
      if (error) throw error;

      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "gift-code",
          recipientEmail: giftEmail.trim(),
          idempotencyKey: `gift-${code}`,
          templateData: {
            code,
            tier: giftTier.charAt(0).toUpperCase() + giftTier.slice(1),
            days: giftDays,
            senderName: user?.user_metadata?.name || "A friend",
          },
        },
      });

      toast.success(`Gift sent to ${giftEmail}!`);
      setGiftEmail("");
    } catch (err: any) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSendingGift(false);
    }
  };

  if (isPremium) {
    const currentConfig = MONTHLY_TIERS.find((t) => t.tier === currentTier);
    const TierIcon = tierIcons[currentTier as keyof typeof tierIcons] ?? Crown;

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className={cn("absolute -top-20 -left-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl", !reducedMotion && "animate-blob-float")} aria-hidden="true" />
        <div className={cn("absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-secondary/15 blur-3xl", !reducedMotion && "animate-blob-float [animation-delay:5s]")} aria-hidden="true" />
        <div className={cn("relative z-10 text-center", !reducedMotion && "animate-bounce-in")}>
          <TierIcon className={cn("h-16 w-16 text-primary mb-4 mx-auto", !reducedMotion && "animate-pulse-glow")} />
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

  const displayTiers = billingPeriod === "monthly" ? MONTHLY_TIERS : ANNUAL_TIERS;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className={cn("absolute -top-20 -left-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl", !reducedMotion && "animate-blob-float")} aria-hidden="true" />
      <div className={cn("absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-secondary/15 blur-3xl", !reducedMotion && "animate-blob-float [animation-delay:5s]")} aria-hidden="true" />

      <div className="container max-w-4xl mx-auto px-4 py-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <CoinBalanceWidget onClick={() => navigate("/wallet")} />
        </div>

        <div className={cn("text-center mb-8", !reducedMotion && "animate-fade-in")}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Crown className={cn("h-8 w-8 text-primary", !reducedMotion && "animate-wiggle")} />
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

        {/* Billing Period Toggle */}
        <div className="flex items-center justify-center gap-1 mb-6 animate-fade-in">
          <Button
            variant={billingPeriod === "monthly" ? "default" : "outline"}
            size="sm"
            onClick={() => setBillingPeriod("monthly")}
            className="rounded-r-none"
          >
            Monthly
          </Button>
          <Button
            variant={billingPeriod === "annual" ? "default" : "outline"}
            size="sm"
            onClick={() => setBillingPeriod("annual")}
            className="rounded-l-none"
          >
            Annual
            <Badge className="ml-1.5 bg-accent text-accent-foreground text-sm px-1.5 py-0">Save 20%</Badge>
          </Button>
        </div>

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
              {["Browse profiles", "1 daily Thot", "Education access", "Real-time chat", "Basic matching"].map((feature) => (
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
          {displayTiers.map((config) => {
            const Icon = tierIcons[config.tier as keyof typeof tierIcons];
            const isHighlighted = config.highlight;
            const isAnnual = config.billingPeriod === "annual";
            const isVip = config.tier === "vip";

            return (
              <Card
                key={`${config.tier}-${config.billingPeriod}`}
                className={cn(
                  "relative transition-all hover:-translate-y-1",
                  isHighlighted && "border-primary shadow-lg ring-2 ring-primary/20"
                )}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                {isAnnual && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-accent text-accent-foreground text-sm">Save 20%</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{config.name}</CardTitle>
                  <div className="mt-2">
                    {isAnnual ? (
                      <>
                        <span className="text-3xl font-bold">${config.annualMonthlyEquivalent?.toFixed(2)}</span>
                        <span className="text-muted-foreground text-sm">/mo</span>
                        <p className="text-sm text-muted-foreground mt-1">Billed ${config.price}/year</p>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-bold">${config.price}</span>
                        <span className="text-muted-foreground text-sm">/mo</span>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2 mb-4">
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
                  {isVip && (
                    <p className="text-sm text-muted-foreground italic mb-4">
                      VIP is for members who've completed the full curriculum and want to give back to the community.
                    </p>
                  )}
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

        {/* Gift Subscription Section */}
        <Card className="mb-6 animate-fade-in border-dashed border-accent/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-5 w-5 text-accent" />
              <span className="font-semibold">Give the Gift of Growth</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Send a membership to a partner or friend. They'll get full access instantly — no account needed to receive it.
            </p>
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="their@email.com"
                value={giftEmail}
                onChange={(e) => setGiftEmail(e.target.value)}
                maxLength={100}
              />
              <div className="flex gap-2">
                <Select value={giftTier} onValueChange={setGiftTier}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plus">Plus</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={giftDays} onValueChange={setGiftDays}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={handleSendGift}
                disabled={sendingGift || !giftEmail.trim()}
              >
                {sendingGift ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" /> Send Gift
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Group/Polycule Pricing */}
        <GroupPricingCard partnerCount={1} />

        <p className="text-center text-sm text-muted-foreground mt-6">
          Cancel anytime · {billingPeriod === "annual" ? "Billed annually" : "Billed monthly"} · Secure checkout via Stripe
        </p>
      </div>
    </div>
  );
};

export default Premium;
