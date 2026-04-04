import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getZodiacInfo, getElementColor, getElementEmoji, type ZodiacSign } from "@/lib/zodiacUtil";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface AstrologyBadgeProps {
  userId: string;
}

export const AstrologyBadge = ({ userId }: AstrologyBadgeProps) => {
  const [open, setOpen] = useState(false);

  const { data: astrology } = useQuery({
    queryKey: ['user-astrology-badge', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_astrology' as any)
        .select('*')
        .eq('user_id', userId)
        .eq('show_on_profile', true)
        .maybeSingle();
      return data as unknown as { sun_sign: ZodiacSign | null; moon_sign: ZodiacSign | null; rising_sign: ZodiacSign | null } | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!astrology?.sun_sign) return null;

  const sunInfo = getZodiacInfo(astrology.sun_sign);
  if (!sunInfo) return null;

  const signs = [
    { label: '☀️ Sun', info: getZodiacInfo(astrology.sun_sign) },
    { label: '🌙 Moon', info: getZodiacInfo(astrology.moon_sign) },
    { label: '⬆️ Rising', info: getZodiacInfo(astrology.rising_sign) },
  ].filter(s => s.info);

  const elements = signs.map(s => s.info!.element);
  const elementCounts: Record<string, number> = {};
  elements.forEach(e => { elementCounts[e] = (elementCounts[e] || 0) + 1; });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-transform hover:scale-110"
          style={{ backgroundColor: getElementColor(sunInfo.element) + '30', color: getElementColor(sunInfo.element) }}
          aria-label={`${sunInfo.name} zodiac sign`}
        >
          {sunInfo.symbol}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3 bg-card border-border" align="end">
        <div className="space-y-2.5">
          {signs.map(({ label, info }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-sm">{label}</span>
              <span className="font-medium text-sm" style={{ color: getElementColor(info!.element) }}>
                {info!.symbol} {info!.name}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {getElementEmoji(info!.element)} {info!.element}
              </span>
            </div>
          ))}

          <div className="border-t border-border pt-2 mt-2">
            <p className="text-xs text-muted-foreground">
              {Object.entries(elementCounts).map(([el, count]) => `${count} ${el.charAt(0).toUpperCase() + el.slice(1)}`).join(', ')}
            </p>
          </div>

          <p className="text-xs text-muted-foreground italic">
            {sunInfo.personality}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
