import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const totalBadgeCountOptions = {
  queryKey: ["total-badge-count"],
  queryFn: async () => {
    const { count, error } = await supabase
      .from("education_modules")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    if (count === null) throw new Error("Badge total unavailable");
    return count;
  },
  staleTime: 60 * 60 * 1000,
};

/** All consumers share one cached request, including Discovery cards. */
export function useTotalBadgeCount() {
  const query = useQuery(totalBadgeCountOptions);
  return { total: query.isError ? undefined : query.data, isLoading: query.isLoading };
}