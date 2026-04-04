import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileCardPartnerBadgeProps {
  partnerCount: number;
  onClick?: () => void;
}

export const ProfileCardPartnerBadge = ({ partnerCount, onClick }: ProfileCardPartnerBadgeProps) => {
  if (partnerCount === 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
        "bg-primary/20 text-primary-foreground backdrop-blur-sm",
        "hover:bg-primary/30 transition-colors min-h-[28px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      )}
      aria-label={`In a polycule with ${partnerCount} partner${partnerCount !== 1 ? "s" : ""}`}
    >
      <Users className="h-3 w-3" />
      <span>{partnerCount === 1 ? "In a polycule" : `${partnerCount} partners`}</span>
    </button>
  );
};
