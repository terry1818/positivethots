import { useCoins } from "@/hooks/useCoins";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface CoinBalanceWidgetProps {
  onClick?: () => void;
  className?: string;
}

export const CoinBalanceWidget = ({ onClick, className }: CoinBalanceWidgetProps) => {
  const { balance, balanceLoading } = useCoins();
  const reducedMotion = useReducedMotion();

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
        "bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20",
        "transition-colors min-h-[44px]",
        className
      )}
      aria-label={`${balance} Thots Coins. Tap to open wallet`}
    >
      <span className={cn("text-lg", !reducedMotion && "animate-pulse")} role="img" aria-hidden="true">🪙</span>
      <span className="font-bold text-yellow-400 tabular-nums text-sm">
        {balanceLoading ? "—" : balance.toLocaleString()}
      </span>
    </button>
  );
};
