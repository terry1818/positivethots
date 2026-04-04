import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { calculateCosmicCompatibility, getZodiacInfo, getElementColor, type ZodiacSign } from "@/lib/zodiacUtil";
import { cn } from "@/lib/utils";

interface AstrologyCompatibilityProps {
  targetUserId: string;
}

export const AstrologyCompatibility = ({ targetUserId }: AstrologyCompatibilityProps) => {
  const { session } = useAuth();

  const { data: myAstrology } = useQuery({
    queryKey: ['user-astrology', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from('user_astrology' as any)
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();
      return data as unknown as { sun_sign: ZodiacSign | null; moon_sign: ZodiacSign | null; rising_sign: ZodiacSign | null; show_on_profile: boolean } | null;
    },
    enabled: !!session?.user?.id,
    staleTime: 10 * 60 * 1000,
  });

  const { data: theirAstrology } = useQuery({
    queryKey: ['user-astrology-badge', targetUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_astrology' as any)
        .select('*')
        .eq('user_id', targetUserId)
        .eq('show_on_profile', true)
        .maybeSingle();
      return data as unknown as { sun_sign: ZodiacSign | null; moon_sign: ZodiacSign | null; rising_sign: ZodiacSign | null } | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const compatibility = useMemo(() => {
    if (!myAstrology?.sun_sign || !theirAstrology?.sun_sign) return null;
    return calculateCosmicCompatibility(myAstrology, theirAstrology);
  }, [myAstrology, theirAstrology]);

  if (!compatibility) return null;

  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (compatibility.score / 100) * circumference;

  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">🔮 Cosmic Compatibility</h4>

      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke={compatibility.color}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: compatibility.color }}>
              {compatibility.score}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium" style={{ color: compatibility.color }}>
            {compatibility.label} {compatibility.emoji}
          </p>
          {compatibility.breakdown.map((b) => {
            const infoA = getZodiacInfo(b.signA as ZodiacSign);
            const infoB = getZodiacInfo(b.signB as ZodiacSign);
            if (!infoA || !infoB) return null;
            return (
              <div key={b.type} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-12">{b.type}</span>
                <span style={{ color: getElementColor(infoA.element) }}>{infoA.symbol}</span>
                <span className="text-muted-foreground">×</span>
                <span style={{ color: getElementColor(infoB.element) }}>{infoB.symbol}</span>
                <span className="ml-auto text-muted-foreground">{b.score}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-3">
        Just for fun — not a real compatibility metric
      </p>
    </div>
  );
};
