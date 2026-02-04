import { CheckCircle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface EducationBadgeProps {
  moduleSlug: string;
  title: string;
  isEarned: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const badgeColors: Record<string, string> = {
  "consent-fundamentals": "bg-[hsl(15_85%_60%)]",
  "enm-principles": "bg-[hsl(175_60%_45%)]",
  "boundaries-communication": "bg-[hsl(270_50%_55%)]",
  "safer-sex": "bg-[hsl(340_70%_55%)]",
  "emotional-responsibility": "bg-[hsl(45_80%_50%)]",
};

const badgeIcons: Record<string, string> = {
  "consent-fundamentals": "✓",
  "enm-principles": "♡",
  "boundaries-communication": "⬡",
  "safer-sex": "✚",
  "emotional-responsibility": "☀",
};

export const EducationBadge = ({ 
  moduleSlug, 
  title, 
  isEarned, 
  size = "md",
  showLabel = false 
}: EducationBadgeProps) => {
  const sizes = {
    sm: "h-6 w-6 text-xs",
    md: "h-10 w-10 text-base",
    lg: "h-14 w-14 text-xl"
  };

  const color = badgeColors[moduleSlug] || "bg-muted";
  const icon = badgeIcons[moduleSlug] || "★";

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-bold transition-all",
          sizes[size],
          isEarned 
            ? `${color} text-white shadow-md` 
            : "bg-muted text-muted-foreground"
        )}
        title={isEarned ? `${title} Badge Earned` : `${title} - Not Yet Earned`}
      >
        {isEarned ? (
          <span>{icon}</span>
        ) : (
          <Lock className={cn(
            size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5"
          )} />
        )}
      </div>
      {showLabel && (
        <span className={cn(
          "text-center leading-tight",
          size === "sm" ? "text-[10px]" : "text-xs",
          isEarned ? "text-foreground" : "text-muted-foreground"
        )}>
          {title}
        </span>
      )}
    </div>
  );
};