import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { PartnerLink } from "@/hooks/usePartnerLinks";

interface PolyculeConstellationProps {
  userId: string;
  linkedPartners: PartnerLink[];
  centerImage?: string | null;
  centerName?: string;
  size?: "sm" | "md";
}

export const PolyculeConstellation = ({
  userId,
  linkedPartners,
  centerImage,
  centerName = "You",
  size = "md",
}: PolyculeConstellationProps) => {
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();
  const partners = linkedPartners.filter(l => l.status === "accepted");
  const count = partners.length;

  const containerSize = size === "sm" ? 200 : 280;
  const centerAvatarSize = size === "sm" ? 48 : 64;
  const partnerAvatarSize = size === "sm" ? 36 : 48;
  const orbitRadius = size === "sm" ? 70 : 100;

  const getPosition = (index: number, total: number) => {
    const angle = (2 * Math.PI * index) / total - Math.PI / 2;
    return {
      x: Math.cos(angle) * orbitRadius + containerSize / 2,
      y: Math.sin(angle) * orbitRadius + containerSize / 2,
    };
  };

  const centerX = containerSize / 2;
  const centerY = containerSize / 2;

  return (
    <div
      className="relative mx-auto"
      style={{ width: containerSize, height: containerSize }}
      role="img"
      aria-label={`Polycule constellation with ${count} partner${count !== 1 ? "s" : ""}`}
    >
      {/* Connecting lines */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={containerSize}
        height={containerSize}
      >
        {partners.map((_, i) => {
          const pos = getPosition(i, count);
          return (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={pos.x}
              y2={pos.y}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeOpacity={0.4}
              strokeDasharray={linkedPartners[i]?.visibility === "private" ? "4 4" : undefined}
            />
          );
        })}
      </svg>

      {/* Center avatar (current user) */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: centerX - centerAvatarSize / 2,
          top: centerY - centerAvatarSize / 2,
          width: centerAvatarSize,
          height: centerAvatarSize,
        }}
      >
        <Avatar
          className={cn(
            "ring-2 ring-primary shadow-lg shadow-primary/20",
            size === "sm" ? "h-12 w-12" : "h-16 w-16"
          )}
        >
          <AvatarImage src={centerImage || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground font-bold">
            {centerName[0]}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Partner avatars */}
      {partners.map((link, i) => {
        const pos = getPosition(i, count);
        const profile = link.partner_profile;
        const isPrivate = link.visibility === "private";

        return (
          <div
            key={link.id}
            className={cn(
              "absolute flex flex-col items-center gap-1 transition-all",
              !reducedMotion && "animate-in fade-in duration-500"
            )}
            style={{
              left: pos.x - partnerAvatarSize / 2,
              top: pos.y - partnerAvatarSize / 2,
              animationDelay: reducedMotion ? undefined : `${i * 100}ms`,
            }}
          >
            <Avatar
              className={cn(
                "ring-2 ring-primary/40 shadow-md shadow-primary/10",
                size === "sm" ? "h-9 w-9" : "h-12 w-12"
              )}
            >
              {isPrivate ? (
                <AvatarFallback className="bg-muted">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </AvatarFallback>
              ) : (
                <>
                  <AvatarImage src={profile?.profile_image || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                    {(profile?.display_name || profile?.name || "?")[0]}
                  </AvatarFallback>
                </>
              )}
            </Avatar>
            {size === "md" && !isPrivate && (
              <span className="text-[11px] text-muted-foreground text-center max-w-[60px] truncate">
                {profile?.display_name || profile?.name}
              </span>
            )}
          </div>
        );
      })}

      {/* Empty state hint */}
      {count === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-muted-foreground text-center mt-20">
            Link a partner to build your polycule
          </p>
        </div>
      )}
    </div>
  );
};
