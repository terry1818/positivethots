import { toast } from "sonner";

export const showCoinEarnedToast = (amount: number, reason: string) => {
  toast(`+${amount} coins • ${reason}`, {
    icon: "🪙",
    duration: 1500,
    position: "bottom-center",
    className: "text-yellow-400",
  });
};
