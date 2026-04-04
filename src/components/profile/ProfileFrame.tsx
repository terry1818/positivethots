import { memo, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FrameId = "newbie" | "scholar" | "streak_master" | "century_club" | "social_butterfly" | "educator" | "og";

export interface FrameDefinition {
  id: FrameId;
  label: string;
  description: string;
  unlockRequirement: string;
  className: string;
}

export const FRAME_DEFINITIONS: FrameDefinition[] = [
  {
    id: "newbie",
    label: "Newbie",
    description: "Default frame",
    unlockRequirement: "Default — everyone starts here",
    className: "ring-2 ring-primary/60",
  },
  {
    id: "scholar",
    label: "Scholar",
    description: "Gradient animated border",
    unlockRequirement: "Complete all Foundation badges (5)",
    className: "ring-[3px] ring-transparent animate-gradient-border-spin",
  },
  {
    id: "streak_master",
    label: "Streak Master",
    description: "Fire ember border",
    unlockRequirement: "Reach a 30-day streak",
    className: "ring-[3px] ring-orange-500 shadow-[0_0_12px_3px_hsl(var(--destructive)/0.4)] animate-pulse",
  },
  {
    id: "century_club",
    label: "Century Club",
    description: "Gold animated border",
    unlockRequirement: "Reach a 100-day streak",
    className: "ring-[3px] ring-amber-400 shadow-[0_0_16px_4px_rgba(251,191,36,0.35)] animate-glow-ring",
  },
  {
    id: "social_butterfly",
    label: "Social Butterfly",
    description: "Pink sparkle border",
    unlockRequirement: "Get 50+ matches",
    className: "ring-[3px] ring-pink-400 shadow-[0_0_14px_3px_hsl(var(--secondary)/0.4)] animate-pulse",
  },
  {
    id: "educator",
    label: "Educator",
    description: "Rainbow gradient border",
    unlockRequirement: "Earn all 20 badges",
    className: "ring-[3px] ring-transparent animate-rainbow-border-spin",
  },
  {
    id: "og",
    label: "OG",
    description: "Vintage exclusive frame",
    unlockRequirement: "Among the first 100 users",
    className: "ring-[3px] ring-amber-600 shadow-[0_0_10px_2px_rgba(180,83,9,0.3)]",
  },
];

export function getFrameDefinition(frameId: string): FrameDefinition {
  return FRAME_DEFINITIONS.find(f => f.id === frameId) || FRAME_DEFINITIONS[0];
}

interface ProfileFrameProps {
  frameId?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  children: ReactNode;
  className?: string;
}

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-24 w-24",
  xl: "h-32 w-32",
};

export const ProfileFrame = memo(({ frameId, size = "md", children, className }: ProfileFrameProps) => {
  const frame = getFrameDefinition(frameId || "newbie");

  return (
    <div className={cn("relative rounded-full overflow-visible", sizeClasses[size], className)}>
      <div className={cn("rounded-full overflow-hidden h-full w-full", frame.className)}>
        {children}
      </div>
      {frameId === "og" && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none z-10">
          OG
        </span>
      )}
    </div>
  );
});

ProfileFrame.displayName = "ProfileFrame";
