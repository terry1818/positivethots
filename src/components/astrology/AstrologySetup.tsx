import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ZODIAC_SIGNS, getElementColor, type ZodiacSign } from "@/lib/zodiacUtil";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Check, ExternalLink } from "lucide-react";

interface AstrologyData {
  id?: string;
  sun_sign: ZodiacSign | null;
  moon_sign: ZodiacSign | null;
  rising_sign: ZodiacSign | null;
  show_on_profile: boolean;
}

export const AstrologySetup = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [selecting, setSelecting] = useState<'sun' | 'moon' | 'rising' | null>(null);

  const { data: astrology } = useQuery({
    queryKey: ['user-astrology', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from('user_astrology' as any)
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();
      return data as unknown as AstrologyData | null;
    },
    enabled: !!session?.user?.id,
  });

  const upsertMutation = useMutation({
    mutationFn: async (updates: Partial<AstrologyData>) => {
      const payload = {
        user_id: session!.user.id,
        sun_sign: updates.sun_sign ?? astrology?.sun_sign ?? null,
        moon_sign: updates.moon_sign ?? astrology?.moon_sign ?? null,
        rising_sign: updates.rising_sign ?? astrology?.rising_sign ?? null,
        show_on_profile: updates.show_on_profile ?? astrology?.show_on_profile ?? true,
        updated_at: new Date().toISOString(),
      };
      if (astrology?.id) {
        const { error } = await supabase.from('user_astrology' as any).update(payload).eq('id', astrology.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_astrology' as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-astrology'] }),
    onError: () => toast.error("Failed to save astrology settings"),
  });

  const handleSelectSign = (type: 'sun' | 'moon' | 'rising', sign: ZodiacSign) => {
    const key = `${type}_sign` as keyof AstrologyData;
    upsertMutation.mutate({ [key]: sign });
    setSelecting(null);
  };

  const currentSign = (type: 'sun' | 'moon' | 'rising'): ZodiacSign | null => {
    if (!astrology) return null;
    return astrology[`${type}_sign` as keyof AstrologyData] as ZodiacSign | null;
  };

  const signInfo = (sign: ZodiacSign | null) => ZODIAC_SIGNS.find(z => z.sign === sign);

  const selectors: { type: 'sun' | 'moon' | 'rising'; icon: string; label: string; subtitle: string }[] = [
    { type: 'sun', icon: '☀️', label: 'Sun Sign', subtitle: 'Your core identity' },
    { type: 'moon', icon: '🌙', label: 'Moon Sign', subtitle: 'Your emotional self' },
    { type: 'rising', icon: '⬆️', label: 'Rising Sign', subtitle: 'How others see you' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">✨ Cosmic Profile</CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="astro-toggle" className="text-xs text-muted-foreground">Show on profile</Label>
            <Switch
              id="astro-toggle"
              checked={astrology?.show_on_profile ?? true}
              onCheckedChange={(v) => upsertMutation.mutate({ show_on_profile: v })}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {selectors.map(({ type, icon, label, subtitle }) => {
          const selected = currentSign(type);
          const info = signInfo(selected);
          const isOpen = selecting === type;

          return (
            <div key={type}>
              <button
                onClick={() => setSelecting(isOpen ? null : type)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors min-h-[52px] text-left"
              >
                <span className="text-lg">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
                {info ? (
                  <span className="text-base font-medium" style={{ color: getElementColor(info.element) }}>
                    {info.symbol} {info.name}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Select</span>
                )}
              </button>

              {isOpen && (
                <div className="grid grid-cols-3 gap-2 mt-2 animate-fade-in">
                  {ZODIAC_SIGNS.map(z => (
                    <button
                      key={z.sign}
                      onClick={() => handleSelectSign(type, z.sign)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all min-h-[64px]",
                        selected === z.sign
                          ? "bg-primary/20 ring-2 ring-primary"
                          : "bg-muted/30 hover:bg-muted/50"
                      )}
                    >
                      <span className="text-2xl" style={{ color: getElementColor(z.element) }}>{z.symbol}</span>
                      <span className="text-xs font-medium">{z.name}</span>
                      {selected === z.sign && <Check className="h-3 w-3 text-primary" />}
                    </button>
                  ))}
                </div>
              )}

              {isOpen && type !== 'sun' && (
                <a
                  href="https://www.costar.com/birth-chart"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary mt-2 ml-1"
                >
                  I don't know my {type} sign <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          );
        })}

        <p className="text-xs text-muted-foreground text-center pt-2">
          Astrology on Positive Thots is just for fun — a great conversation starter, not a compatibility guarantee! 🔮
        </p>
      </CardContent>
    </Card>
  );
};
