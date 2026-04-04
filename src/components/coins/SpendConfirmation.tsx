import { useCoins, type StoreItem } from "@/hooks/useCoins";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SpendConfirmationProps {
  item: StoreItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SpendConfirmation = ({ item, open, onOpenChange }: SpendConfirmationProps) => {
  const { balance, spend, spending } = useCoins();
  const canAfford = balance >= item.coin_cost;
  const balanceAfter = balance - item.coin_cost;

  const handleConfirm = async () => {
    try {
      await spend({
        itemType: item.item_type,
        amount: item.coin_cost,
        description: `Purchased: ${item.name}`,
      });
      toast.success(`${item.icon} ${item.name} activated!`);
      onOpenChange(false);
    } catch {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Spend Coins?</DialogTitle>
        </DialogHeader>
        <div className="text-center py-4">
          <span className="text-5xl block mb-3">{item.icon}</span>
          <p className="font-semibold text-lg">{item.name}</p>
          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
          <div className="mt-4 p-3 rounded-lg bg-muted/50 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Cost</span>
              <span className="text-yellow-400 font-bold">🪙 {item.coin_cost}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Your balance</span>
              <span className="tabular-nums">🪙 {balance.toLocaleString()}</span>
            </div>
            <hr className="border-border/50" />
            <div className="flex justify-between text-sm font-bold">
              <span>After purchase</span>
              <span className={balanceAfter < 0 ? "text-red-400" : "text-green-400"}>
                🪙 {Math.max(0, balanceAfter).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!canAfford || spending}>
            {spending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
