import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VerifiedBadgeOverlayProps {
  isVerified: boolean;
  size?: "sm" | "md" | "lg";
  showUnverifiedLink?: boolean;
  onVerifyClick?: () => void;
}

export const VerifiedBadgeOverlay = ({
  isVerified,
  size = "md",
  showUnverifiedLink = false,
  onVerifyClick,
}: VerifiedBadgeOverlayProps) => {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const containerSizes = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-7 w-7",
  };

  if (!isVerified && !showUnverifiedLink) return null;

  if (!isVerified && showUnverifiedLink) {
    return (
      <button
        onClick={onVerifyClick}
        className="absolute bottom-0 right-0 z-20 rounded-full bg-muted border-2 border-card flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
        style={{ width: size === "sm" ? 20 : size === "md" ? 24 : 28, height: size === "sm" ? 20 : size === "md" ? 24 : 28 }}
        title="Not yet verified — tap to verify"
      >
        <ShieldCheck className={cn(sizes[size], "text-muted-foreground")} />
      </button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "absolute bottom-0 right-0 z-20 rounded-full bg-primary border-2 border-card flex items-center justify-center shadow-md",
              containerSizes[size]
            )}
          >
            <ShieldCheck className={cn(sizes[size], "text-primary-foreground")} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-sm">
          This person verified their identity with a selfie check
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
