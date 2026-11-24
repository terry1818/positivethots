import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Coins, Frame, Rocket, Send, Snowflake, Sparkles, Zap, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSuperLikes } from "@/hooks/useSuperLikes";
import { GuideArt } from "@/components/mascot/GuideArt";
import { BrandedEmptyState } from "@/components/BrandedEmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { CoinWallet } from "@/components/coins/CoinWallet";
import { COINS_LIVE } from "@/lib/payments";

type Holdings = { freezes: number; doublers: number; boosts: number; reveals: number; frames: number; coins: number };

/** Everything in the Wallet is read from the member's own rows. Nothing here is a promise: it is what they hold. */
async function loadHoldings(userId: string): Promise<Holdings> {
  const [stats, profile] = await Promise.all([
    supabase.from("user_learning_stats").select("streak_freezes, boost_credits, xp_doublers").eq("user_id", userId).maybeSingle(),
    supabase.from("profiles").select("bonus_mystery_reveals, earned_frames, thots_coins_balance").eq("id", userId).maybeSingle(),
  ]);
  if (stats.error) throw stats.error;
  if (profile.error) throw profile.error;
  const s = (stats.data ?? {}) as { streak_freezes?: number | null; boost_credits?: number | null; xp_doublers?: number | null };
  const p = (profile.data ?? {}) as { bonus_mystery_reveals?: number | null; earned_frames?: string[] | null; thots_coins_balance?: number | null };
  return {
    freezes: s.streak_freezes ?? 0,
    doublers: s.xp_doublers ?? 0,
    boosts: s.boost_credits ?? 0,
    reveals: p.bonus_mystery_reveals ?? 0,
    // "newbie" is the frame every member starts with, so it is not counted as earned.
    frames: (p.earned_frames ?? []).filter((f) => f !== "newbie").length,
    coins: p.thots_coins_balance ?? 0,
  };
}

type Item = { key: string; icon: LucideIcon; tone: string; name: string; note: string; count: number | "∞"; to?: string };

const Wallet = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { balance: thots, isUnlimited, loading: thotsLoading } = useSuperLikes();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["wallet-holdings", user?.id],
    queryFn: () => loadHoldings(user!.id),
    enabled: !!user,
  });

  const loading = authLoading || isLoading || thotsLoading || (isFetching && !data);
  const items: Item[] = data ? [
    { key: "thots", icon: Send, tone: "pink", name: "Thots", note: "Tell someone they stand out. Send one from Discover.", count: isUnlimited ? "∞" : thots, to: "/" },
    { key: "freezes", icon: Snowflake, tone: "info", name: "Streak Freezes", note: "Covers a day you miss, so your streak holds. Used on its own.", count: data.freezes },
    { key: "doublers", icon: Zap, tone: "highlight", name: "Double XP", note: "Your next finished lesson pays double.", count: data.doublers, to: "/learn" },
    { key: "boosts", icon: Rocket, tone: "reward", name: "Profile Boosts", note: "24 hours near the front of Discover. Start one from Profile.", count: data.boosts, to: "/profile" },
    { key: "reveals", icon: Sparkles, tone: "area", name: "Mystery Match Reveals", note: "An extra reveal in Discover once today's are used.", count: data.reveals, to: "/" },
    { key: "frames", icon: Frame, tone: "correct", name: "Photo frames", note: "Frames you have earned. Choose one in Edit Profile.", count: data.frames, to: "/profile/edit" },
  ] : [];

  return (
    <div className="kit-area-learn min-h-screen bg-background">
      <header className="kit-header sticky top-0 z-30">
        <div className="mx-auto flex w-full max-w-md items-center gap-1 px-2 py-1">
          <button type="button" className="kit-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft aria-hidden="true" />
          </button>
          <h1 className="text-xl font-extrabold">Wallet</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md space-y-4 px-4 pb-8 pt-4">
        {isError ? (
          <BrandedEmptyState
            mascot="confused"
            headline="We couldn't load your Wallet."
            description="Check your connection and try again."
            ctaLabel="Try again"
            onCtaClick={() => refetch()}
            className="py-4"
          />
        ) : (
          <>
            <div className="kit-panel h-[150px]">
              <div className="pb-1"><GuideArt name="guide-chest-open" size={130} /></div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-extrabold [text-wrap:balance]">What you've earned</h2>
              <p className="mt-1 text-muted-foreground [text-wrap:pretty]">Rewards from the daily spin, streaks and levels. They are yours until you use them.</p>
            </div>

            {loading ? (
              <div className="space-y-2.5" aria-busy="true" aria-label="Loading your Wallet">
                {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[68px] w-full rounded-2xl" />)}
              </div>
            ) : (
              <ul className="space-y-2.5">
                {items.map((item, i) => {
                  const empty = item.count === 0;
                  const body = (
                    <>
                      <span className="kit-coin kit-coin-lg" data-tone={empty ? "quiet" : item.tone}><item.icon aria-hidden="true" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold leading-tight">{item.name}</span>
                        <span className="block text-sm text-muted-foreground [text-wrap:pretty]">{item.note}</span>
                      </span>
                      <span className={empty ? "wallet-count text-muted-foreground" : "wallet-count"} aria-label={item.count === "∞" ? "Unlimited" : `${item.count} held`}>{item.count}</span>
                      {item.to && <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />}
                    </>
                  );
                  return (
                    <li key={item.key} className="kit-rise" style={{ "--i": i } as CSSProperties}>
                      {item.to ? (
                        <button type="button" className="kit-row" onClick={() => navigate(item.to!)}>{body}</button>
                      ) : (
                        <div className="kit-row">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <button type="button" className="kit-row kit-row-next" onClick={() => navigate("/learn")}>
              <span className="kit-coin kit-coin-lg" data-tone="area"><Sparkles aria-hidden="true" /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold leading-tight">Win more on the daily spin</span>
                <span className="block text-sm text-muted-foreground [text-wrap:pretty]">One spin a day in Learn. Every prize on the wheel lands here.</span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>

            {COINS_LIVE ? (
              <CoinWallet />
            ) : !loading && data && data.coins > 0 ? (
              // Coins are not switched on. A member who somehow holds some is told they are kept, nothing more.
              <div className="kit-row">
                <span className="kit-coin kit-coin-lg" data-tone="quiet"><Coins aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold leading-tight">Thots Coins</span>
                  <span className="block text-sm text-muted-foreground [text-wrap:pretty]">Coins aren't in use yet. Yours are kept for when they are.</span>
                </span>
                <span className="wallet-count">{data.coins.toLocaleString()}</span>
              </div>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
};

export default Wallet;
