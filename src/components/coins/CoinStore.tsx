import { useState } from "react";
import { useCoins, type StoreItem } from "@/hooks/useCoins";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SpendConfirmation } from "./SpendConfirmation";

export const CoinStore = () => {
  const { storeItems, balance } = useCoins();
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);

  if (storeItems.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {storeItems.map((item) => {
          const canAfford = balance >= item.coin_cost;
          return (
            <Card
              key={item.id}
              className={cn(
                "cursor-pointer transition-all hover:-translate-y-0.5",
                !canAfford && "opacity-60"
              )}
              onClick={() => setSelectedItem(item)}
            >
              <CardContent className="pt-4 pb-3 px-3 text-center">
                <span className="text-3xl block mb-2">{item.icon}</span>
                <p className="font-medium text-sm leading-tight">{item.name}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                <div className="mt-2">
                  <span className="text-yellow-400 font-bold text-sm">🪙 {item.coin_cost}</span>
                </div>
                {!canAfford && (
                  <p className="text-xs text-red-400 mt-1">Need {item.coin_cost - balance} more</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedItem && (
        <SpendConfirmation
          item={selectedItem}
          open={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
        />
      )}
    </>
  );
};
