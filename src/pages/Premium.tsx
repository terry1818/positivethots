import { GuideArt } from "@/components/mascot/GuideArt";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, type CSSProperties } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/stores/sessionStore";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, Heart, Zap, ArrowLeft, Loader2, Check, Star, Gift, Send, Clock, AlertTriangle } from "lucide-react";
import {
  MONTHLY_TIERS,
  ANNUAL_TIERS,
  FEATURE_LABELS,
  planAdds,
} from "@/lib/subscriptionTiers";
import { PAYMENTS_OPEN } from "@/lib/payments";
import { toast } from "sonner";
import { GroupPricingCard } from "@/components/coins/GroupPricingCard";

const PLAN_ICON = { plus: Zap, premium: Crown, vip: Star } as const;
const PLAN_TONE = { plus: "info", premium: "area", vip: "reward" } as const;
const PLAN_LINE: Record<string, string> = {
  plus: "Know who said yes",
  premium: "Be seen sooner and filter more",
  vip: "Everything, and a way to give back",
};
const FREE_FEATURES = ["Lessons and badges, except Advanced and Personal Growth", "Discover and Connect", "1 Thot a day", "Chat with your connections"];

const PageHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
  <header className="kit-header sticky top-0 z-30">
    <div className="mx-auto flex w-full max-w-md items-center gap-1 px-2 py-1 md:max-w-4xl">
      <button type="button" className="kit-icon-btn" onClick={onBack} aria-label="Back">
        <ArrowLeft aria-hidden="true" />
      </button>
      <h1 className="text-xl font-extrabold">{title}</h1>
    </div>
  </header>
);

const Premium = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isPremium, tier: currentTier, loading: planLoading } = useSubscription();
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [redeemingCode, setRedeemingCode] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  // Gift state
  const [giftEmail, setGiftEmail] = useState("");
  const [giftTier, setGiftTier] = useState("premium");
  const [giftDays, setGiftDays] = useState("14");
  const [sendingGift, setSendingGift] = useState(false);

  // Pre-fill from session store (referral flow)
  useEffect(() => {
    const refCode = useSessionStore.getState().referralCode;
    if (refCode) {
      setPromoCode(refCode);
      useSessionStore.getState().setReferralCode(null);
    }
  }, []);

  const [showCanceledNotice, setShowCanceledNotice] = useState(false);
  const [showFailedNotice, setShowFailedNotice] = useState(false);

  // Coming back from checkout
  useEffect(() => {
    if (searchParams.get("redeemed") === "true") toast.success("Your trial has started. Welcome aboard!");
    if (searchParams.get("canceled") === "true") setShowCanceledNotice(true);
    if (searchParams.get("failed") === "true") setShowFailedNotice(true);
  }, [searchParams]);

  const handleSubscribe = async (priceId: string) => {
    if (!PAYMENTS_OPEN) return;
    setLoading(priceId);
    setCheckoutError(false);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", { body: { price_id: priceId } });
      if (error) throw error;
      if (!data?.url) throw new Error("No checkout address returned");
      window.open(data.url, "_blank");
    } catch (err) {
      console.error("Checkout error:", err);
      setCheckoutError(true);
    } finally {
      setLoading(null);
    }
  };

  const handleRedeemCode = async () => {
    if (!promoCode.trim()) return;
    setRedeemingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke("redeem-promo-code", { body: { code: promoCode.trim() } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        toast.success("Code accepted. Opening checkout…");
        window.open(data.url, "_blank");
      }
    } catch {
      toast.error("That code didn't work. Check it and try again.");
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

      const { error: sendError } = await supabase.functions.invoke("send-gift-code", {
        body: { code, recipientEmail: giftEmail.trim() },
      });
      if (sendError) throw sendError;

      toast.success(`Gift sent to ${giftEmail}`);
      setGiftEmail("");
    } catch {
      toast.error("The gift didn't send. Please try again.");
    } finally {
      setSendingGift(false);
    }
  };

  const goBack = () => navigate(-1);

  // The plan is still being read: say so, instead of flashing the wrong screen.
  if (planLoading) {
    return (
      <div className="kit-area-learn min-h-screen bg-background" aria-busy="true" aria-label="Loading plans">
        <PageHeader title="Plans" onBack={goBack} />
        <main className="mx-auto w-full max-w-md space-y-4 px-4 pb-8 pt-4 md:max-w-4xl">
          <Skeleton className="h-[150px] w-full rounded-[28px]" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-44 w-full rounded-[20px]" />)}
          </div>
        </main>
      </div>
    );
  }

  if (isPremium) {
    const currentConfig = MONTHLY_TIERS.find((t) => t.tier === currentTier);
    const planName = currentConfig?.name ?? "your plan";
    const justSubscribed = searchParams.get("success") === "true";
    const owned = currentConfig?.features ?? [];

    return (
      <div className="kit-area-learn min-h-screen bg-background">
        <PageHeader title="Your plan" onBack={goBack} />
        <main className="mx-auto w-full max-w-md space-y-4 px-4 pb-8 pt-4">
          <div className="kit-panel h-[190px]">
            <div className="pb-2"><GuideArt name={justSubscribed ? "guide-high-five" : "guide-level-up"} size={160} /></div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-extrabold [text-wrap:balance]">{justSubscribed ? `Welcome to ${planName}!` : `You're on ${planName}`}</h2>
            <p className="mt-1 text-muted-foreground [text-wrap:pretty]">
              {justSubscribed ? "Your plan is active. Here is what it includes." : "Here is what your plan includes."}
            </p>
          </div>
          {owned.length > 0 && (
            <ul className="kit-card space-y-2 p-4">
              {owned.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check className="kit-text mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{FEATURE_LABELS[f]}</span>
                </li>
              ))}
            </ul>
          )}
          <Button className="kit-cta w-full" onClick={() => navigate("/likes")}>See who wants to connect</Button>
          <Button variant="outline" className="min-h-[44px] w-full font-bold" onClick={() => navigate("/settings")}>Manage plan</Button>
          <p className="text-center">
            <Link to="/cancellation" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-primary hover:underline">Cancellation Policy</Link>
          </p>
        </main>
      </div>
    );
  }

  const displayTiers = billingPeriod === "monthly" ? MONTHLY_TIERS : ANNUAL_TIERS;
  const onFree = !currentTier || currentTier === "free";

  return (
    <div className="kit-area-learn min-h-screen bg-background">
      <PageHeader title="Plans" onBack={goBack} />

      <main className="mx-auto w-full max-w-md space-y-4 px-4 pb-8 pt-4 md:max-w-4xl">
        <div className="kit-panel h-[150px]">
          <div className="pb-1"><GuideArt name="guide-level-up" size={130} /></div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-extrabold [text-wrap:balance]">A plan adds more ways to connect</h2>
          <p className="mt-1 text-muted-foreground [text-wrap:pretty]">Most lessons stay free. Any plan opens Advanced and Personal Growth.</p>
        </div>

        {!PAYMENTS_OPEN && (
          <div className="kit-row" role="status">
            <span className="kit-coin" data-tone="info"><Clock aria-hidden="true" /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold leading-tight">Plans open soon</span>
              <span className="block text-sm text-muted-foreground [text-wrap:pretty]">We're finishing secure checkout. Nothing here can charge you yet.</span>
            </span>
          </div>
        )}

        {PAYMENTS_OPEN && (showFailedNotice || checkoutError) && (
          <div className="kit-row !items-start" role="alert">
            <span className="kit-coin" data-tone="urgent"><AlertTriangle aria-hidden="true" /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold leading-tight">{checkoutError ? "We couldn't open checkout" : "Your payment didn't go through"}</span>
              <span className="block text-sm text-muted-foreground [text-wrap:pretty]">
                {checkoutError ? "Check your connection and choose a plan again." : "You can try again with another payment method."}
              </span>
              <span className="mt-1 flex flex-wrap gap-x-4">
                <button type="button" className="min-h-[44px] text-sm font-bold text-primary" onClick={() => { setShowFailedNotice(false); setCheckoutError(false); }}>Dismiss</button>
                <Link to="/contact" className="inline-flex min-h-[44px] items-center text-sm font-bold text-primary">Contact us</Link>
              </span>
            </span>
          </div>
        )}

        {PAYMENTS_OPEN && showCanceledNotice && (
          <div className="kit-row !items-start" role="status">
            <span className="kit-coin" data-tone="info"><Heart aria-hidden="true" /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold leading-tight">Your plan is cancelled</span>
              <span className="block text-sm text-muted-foreground [text-wrap:pretty]">It stays active until the end of the period you paid for. You can start a plan again any time.</span>
              <button type="button" className="mt-1 min-h-[44px] text-sm font-bold text-primary" onClick={() => setShowCanceledNotice(false)}>Dismiss</button>
            </span>
          </div>
        )}

        <div className="kit-tabs" role="group" aria-label="Billing period">
          <button type="button" className="kit-tab" data-state={billingPeriod === "monthly" ? "active" : "inactive"} aria-pressed={billingPeriod === "monthly"} onClick={() => setBillingPeriod("monthly")}>
            Monthly
          </button>
          <button type="button" className="kit-tab" data-state={billingPeriod === "annual" ? "active" : "inactive"} aria-pressed={billingPeriod === "annual"} onClick={() => setBillingPeriod("annual")}>
            Yearly, save 20%
          </button>
        </div>

        {/* Free */}
        <section className="kit-row !items-start" aria-label="Free plan">
          <span className="kit-coin kit-coin-lg" data-tone="quiet"><Heart aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold leading-tight">Free</h3>
              {onFree && <span className="kit-chip" data-tone="quiet">Your plan</span>}
              <p className="ml-auto shrink-0 text-2xl font-black leading-none tabular-nums">$0</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground [text-wrap:pretty]">{FREE_FEATURES.join(" · ")}</p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {displayTiers.map((config, idx) => {
            const Icon = PLAN_ICON[config.tier as keyof typeof PLAN_ICON];
            const isAnnual = config.billingPeriod === "annual";
            const { includes, adds } = planAdds(config.tier);
            const isCurrent = currentTier === config.tier;

            return (
              <article
                key={`${config.tier}-${config.billingPeriod}`}
                className="kit-card kit-rise plan-card flex min-w-0 flex-col p-4"
                data-featured={config.highlight ? "true" : undefined}
                style={{ "--i": idx } as CSSProperties}
                aria-label={`${config.name} plan`}
              >
                {config.highlight && <p className="mb-2"><span className="kit-chip" data-tone="area">Recommended</span></p>}
                <div className="flex items-start gap-3">
                  <span className="kit-coin kit-coin-lg" data-tone={PLAN_TONE[config.tier as keyof typeof PLAN_TONE]}><Icon aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1 self-center">
                    <h3 className="text-lg font-extrabold leading-tight">{config.name}</h3>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xl font-black leading-none tabular-nums min-[360px]:text-2xl">${config.price}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{isAnnual ? "a year" : "a month"}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground [text-wrap:pretty]">
                  {PLAN_LINE[config.tier]}{isAnnual && `. Works out to $${config.annualMonthlyEquivalent?.toFixed(2)} a month`}
                </p>

                <ul className="mt-3 flex-1 space-y-1.5">
                  {includes && (
                    <li className="flex items-start gap-2 text-sm font-bold">
                      <Check className="kit-text mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>Everything in {includes}</span>
                    </li>
                  )}
                  {adds.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="kit-text mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{FEATURE_LABELS[feature]}</span>
                    </li>
                  ))}
                </ul>
                {config.tier === "vip" && (
                  <p className="mt-2 text-sm text-muted-foreground [text-wrap:pretty]">
                    For members who have finished the lessons and want to give back to the community.
                  </p>
                )}

                <div className="mt-4">
                  {isCurrent ? (
                    <p className="plan-soon"><Check className="h-4 w-4" aria-hidden="true" /> Your plan</p>
                  ) : !PAYMENTS_OPEN ? (
                    <p className="plan-soon"><Clock className="h-4 w-4" aria-hidden="true" /> Opens soon</p>
                  ) : (
                    <Button
                      variant={config.highlight ? "default" : "outline"}
                      className={config.highlight ? "kit-cta w-full" : "min-h-[48px] w-full font-bold"}
                      onClick={() => handleSubscribe(config.priceId)}
                      disabled={loading !== null}
                    >
                      {loading === config.priceId ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Opening checkout" /> : `Start ${config.name}`}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* Codes, gifts and group plans all end in a checkout, so they wait for checkout to open. */}
        {PAYMENTS_OPEN && (
          <>
            <section className="kit-card space-y-3 p-4" aria-labelledby="promo-title">
              <div className="flex items-center gap-3">
                <span className="kit-coin" data-tone="reward"><Gift aria-hidden="true" /></span>
                <h3 id="promo-title" className="font-bold leading-tight">Have a promo or referral code?</h3>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter code"
                  aria-label="Promo or referral code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  maxLength={12}
                  className="kit-field font-mono uppercase tracking-wider"
                />
                <Button className="min-h-[48px] shrink-0 px-5 font-bold" onClick={handleRedeemCode} disabled={redeemingCode || !promoCode.trim()}>
                  {redeemingCode ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Checking code" /> : "Redeem"}
                </Button>
              </div>
            </section>

            <section className="kit-card space-y-3 p-4" aria-labelledby="gift-title">
              <div className="flex items-center gap-3">
                <span className="kit-coin" data-tone="pink"><Gift aria-hidden="true" /></span>
                <div className="min-w-0">
                  <h3 id="gift-title" className="font-bold leading-tight">Give a trial</h3>
                  <p className="text-sm text-muted-foreground [text-wrap:pretty]">Email a partner or friend a code. They redeem it after they sign in.</p>
                </div>
              </div>
              <Input
                type="email"
                placeholder="their@email.com"
                aria-label="Their email address"
                autoComplete="off"
                value={giftEmail}
                onChange={(e) => setGiftEmail(e.target.value)}
                maxLength={100}
                className="kit-field"
              />
              <div className="flex gap-2">
                <Select value={giftTier} onValueChange={setGiftTier}>
                  <SelectTrigger className="min-h-[48px] flex-1" aria-label="Plan"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plus">Plus</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={giftDays} onValueChange={setGiftDays}>
                  <SelectTrigger className="min-h-[48px] flex-1" aria-label="Length"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="min-h-[48px] w-full font-bold" onClick={handleSendGift} disabled={sendingGift || !giftEmail.trim()}>
                {sendingGift ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Sending" /> : <><Send className="mr-1 h-4 w-4" aria-hidden="true" /> Send gift</>}
              </Button>
            </section>

            <GroupPricingCard partnerCount={1} />
          </>
        )}

        <div className="space-y-1 pt-2 text-center">
          <p className="text-sm text-muted-foreground">
            Cancel any time · {billingPeriod === "annual" ? "Billed once a year" : "Billed once a month"}
          </p>
          <Link to="/cancellation" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-primary hover:underline">Cancellation Policy</Link>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground [text-wrap:pretty]">
            Plans renew at the end of each billing period unless cancelled at least 24 hours before the renewal date. You can manage or cancel your plan in Settings. See our{" "}
            <Link to="/terms" className="underline hover:text-foreground">Terms of Service</Link> for full details.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Premium;
