import { useCoins } from "@/hooks/useCoins";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, Coins, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CoinPurchaseSheet } from "./CoinPurchaseSheet";
import { CoinStore } from "./CoinStore";

export const CoinWallet = () => {
  const { balance, balanceLoading, transactions, txLoading } = useCoins();
  const [showPurchase, setShowPurchase] = useState(false);
  const [showStore, setShowStore] = useState(false);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  const txIcon = (type: string) => {
    if (type.startsWith("earned") || type === "purchase" || type === "gifted_received" || type === "refund") {
      return <ArrowDown className="h-4 w-4 text-green-400" />;
    }
    return <ArrowUp className="h-4 w-4 text-red-400" />;
  };

  if (showStore) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setShowStore(false)}>
          ← Back to Wallet
        </Button>
        <CoinStore />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
        <CardContent className="pt-6 text-center">
          <span className="text-4xl mb-2 block" role="img" aria-hidden="true">🪙</span>
          {balanceLoading ? (
            <Skeleton className="h-10 w-32 mx-auto" />
          ) : (
            <p className="text-4xl font-bold text-yellow-400 tabular-nums">{balance.toLocaleString()}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">Thots Coins</p>
          <div className="flex gap-2 mt-4 justify-center">
            <Button onClick={() => setShowPurchase(true)} className="bg-primary">
              <Coins className="h-4 w-4 mr-1" /> Buy Coins
            </Button>
            <Button variant="outline" onClick={() => setShowStore(true)}>
              <ShoppingCart className="h-4 w-4 mr-1" /> Store
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How to Earn */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">How to Earn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[
            { label: "Daily login", amount: "5–15" },
            { label: "Quiz correct answer", amount: "2" },
            { label: "Badge completion", amount: "25–100" },
            { label: "Sprint top 3", amount: "20–50" },
            { label: "Streak milestones", amount: "25–100" },
            { label: "Referral bonus", amount: "100" },
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-center">
              <span className="text-muted-foreground">{item.label}</span>
              <Badge variant="secondary" className="text-yellow-400 bg-yellow-500/10">
                +{item.amount} 🪙
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No transactions yet. Start earning coins! ✨
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                  {txIcon(tx.transaction_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                  </div>
                  <span className={cn(
                    "font-bold tabular-nums text-sm",
                    tx.amount > 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CoinPurchaseSheet open={showPurchase} onOpenChange={setShowPurchase} />
    </div>
  );
};
