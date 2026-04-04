import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TrialCountdownProps {
  expiresAt: string;
  className?: string;
}

export const TrialCountdown = ({ expiresAt, className }: TrialCountdownProps) => {
  const now = new Date();
  const end = new Date(expiresAt);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    return (
      <Badge className={cn("bg-red-500/20 text-red-400", className)}>
        Trial expired
      </Badge>
    );
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  const label = days > 0 ? `${days} day${days !== 1 ? "s" : ""} left` : `${hours}h left`;

  const color = days > 3
    ? "bg-green-500/20 text-green-400"
    : days > 0
    ? "bg-yellow-500/20 text-yellow-400"
    : "bg-red-500/20 text-red-400";

  return (
    <Badge className={cn(color, className)}>
      ⏱️ {label}
    </Badge>
  );
};
