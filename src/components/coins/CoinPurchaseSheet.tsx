import { useCoins } from "@/hooks/useCoins";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

interface CoinPurchaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CoinPurchaseSheet = ({ open, onOpenChange }: CoinPurchaseSheetProps) => {
  const { packages } = useCoins();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (pkg: typeof packages[0]) => {
    if (!pkg.stripe_price_id) {
      toast.info("Coin purchases coming soon!");
      return;
    }
    setLoading(pkg.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { price_id: pkg.stripe_price_id },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const perCoinPrice = (pkg: typeof packages[0]) => {
    const total = pkg.coins + pkg.bonus_coins;
    return (pkg.price_usd / total * 100).toFixed(1);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            🪙 Buy Thots Coins
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-3 mt-4">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={cn(
                "relative transition-all",
                pkg.is_best_value && "border-primary ring-2 ring-primary/20"
              )}
            >
              {pkg.is_best_value && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs">Best Value</Badge>
                </div>
              )}
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{pkg.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-yellow-400 font-bold">🪙 {pkg.coins.toLocaleString()}</span>
                      {pkg.bonus_coins > 0 && (
                        <Badge variant="secondary" className="text-green-400 bg-green-500/10 text-xs">
                          +{pkg.bonus_coins} bonus
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {perCoinPrice(pkg)}¢ per coin
                    </p>
                  </div>
                  <Button
                    onClick={() => handlePurchase(pkg)}
                    disabled={loading !== null}
                    size="sm"
                    className={cn(pkg.is_best_value && "bg-primary")}
                  >
                    {loading === pkg.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      `$${pkg.price_usd}`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Secure payment</span>
          <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Instant delivery</span>
        </div>
      </SheetContent>
    </Sheet>
  );
};
