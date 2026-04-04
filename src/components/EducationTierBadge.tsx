import { Shield, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EducationTierBadgeProps {
  badgeCount: number;
  size?: "sm" | "md";
}

const getTierInfo = (count: number) => {
  if (count >= 20) return { label: "All Tiers", color: "bg-amber-500 text-white", icon: "star" };
  if (count >= 16) return { label: "Advanced", color: "bg-accent text-accent-foreground", icon: "shield" };
  if (count >= 12) return { label: "Relationships", color: "bg-[hsl(340_65%_55%)] text-white", icon: "shield" };
  if (count >= 8) return { label: "Identity", color: "bg-[hsl(285_55%_45%)] text-white", icon: "shield" };
  if (count >= 5) return { label: "Foundation", color: "bg-success text-white", icon: "shield" };
  return null;
};

export const EducationTierBadge = ({ badgeCount, size = "sm" }: EducationTierBadgeProps) => {
  const tier = getTierInfo(badgeCount);
  if (!tier) return null;

  const iconSize = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full font-semibold border-0",
              tier.color,
              size === "sm" ? "px-1.5 py-0.5 text-sm" : "px-2 py-0.5 text-sm"
            )}
          >
            {tier.icon === "star" ? (
              <Star className={cn(iconSize, "fill-current")} />
            ) : (
              <Shield className={cn(iconSize, "fill-current")} />
            )}
            {tier.label}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-sm">
          Completed {badgeCount} of 20 education badges
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
