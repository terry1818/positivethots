import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link2 } from "lucide-react";

interface FetLifeBadgeProps {
  username: string;
  status: "self_reported" | "verified";
  size?: "sm" | "md";
}

export const FetLifeBadge = ({ username, status, size = "sm" }: FetLifeBadgeProps) => {
  const sizeClasses = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-[hsl(280,60%,50%)]/15 px-1.5 py-0.5 cursor-default"
            aria-label={`FetLife: @${username} (${status === "verified" ? "verified" : "self-reported"})`}
          >
            <Link2 className={`${sizeClasses} text-[hsl(280,60%,50%)]`} />
            {size === "md" && (
              <span className="text-xs font-medium text-[hsl(280,60%,50%)]">FL</span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            FetLife: @{username}{" "}
            <span className="text-muted-foreground">
              ({status === "verified" ? "verified" : "self-reported"})
            </span>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
