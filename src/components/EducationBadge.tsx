import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface EducationBadgeProps {
  moduleSlug: string;
  title: string;
  isEarned: boolean;
  tier?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

// Tier-based colors — purple family
const tierColors: Record<string, string> = {
  foundation: "bg-primary",
  sexual_health: "bg-success",
  identity: "bg-[hsl(285_55%_45%)]",
  relationships: "bg-[hsl(340_65%_55%)]",
  advanced: "bg-accent",
};

// Legacy slug-based colors as fallback
const badgeColors: Record<string, string> = {
  "consent-fundamentals": "bg-primary",
  "enm-principles": "bg-secondary",
  "boundaries-communication": "bg-[hsl(285_55%_45%)]",
  "safer-sex": "bg-[hsl(340_65%_55%)]",
  "emotional-responsibility": "bg-accent",
};

const badgeIcons: Record<string, string> = {
  "consent-fundamentals": "✓",
  "enm-principles": "♡",
  "boundaries-communication": "⬡",
  "safer-sex": "✚",
  "emotional-responsibility": "☀",
  "understanding-desire": "♥",
  "sexual-wellness-basics": "⊕",
  "pleasure-satisfaction": "✧",
  "common-sexual-concerns": "⚕",
  "sexual-orientation-spectrum": "🌈",
  "gender-identity-expression": "⚧",
  "relationship-orientations": "◇",
  "intersectionality-intimacy": "∞",
  "relationship-skills-foundation": "⚘",
  "navigating-conflict": "⚖",
  "jealousy-insecurity": "♦",
  "maintaining-intimacy": "❋",
  "advanced-enm-practices": "★",
  "kink-bdsm-basics": "⛓",
  "relationship-vision": "◉",
  "trauma-informed-relating": "🫂",
  "digital-consent-boundaries": "📱",
  "decolonizing-relationships": "🌍",
  "mental-health-first-aid": "🧠",
  "reproductive-autonomy": "⚕",
  "addiction-compulsivity": "🔄",
  "neurodivergence-intimacy": "🧩",
  "financial-intimacy": "💰",
  "grief-relationship-transitions": "🕊",
};

export const EducationBadge = ({ 
  moduleSlug, 
  title, 
  isEarned, 
  tier = "foundation",
  size = "md",
  showLabel = false 
}: EducationBadgeProps) => {
  const sizes = {
    sm: "h-6 w-6 text-xs",
    md: "h-10 w-10 text-base",
    lg: "h-14 w-14 text-xl"
  };

  const color = badgeColors[moduleSlug] || tierColors[tier] || "bg-muted";
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
