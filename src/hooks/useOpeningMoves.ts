import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OpeningMove {
  id: string;
  category: string;
  text: string;
  context_note: string | null;
  related_badge_slug: string | null;
  requires_education_tier: number;
}

export const useOpeningMoves = (userTier: number = 0) => {
  return useQuery({
    queryKey: ["opening-moves"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opening_moves")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return (data || []) as OpeningMove[];
    },
    staleTime: 30 * 60 * 1000,
  });
};
