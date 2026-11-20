import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export function useModuleCounts() {
  return useQuery({ queryKey: ["module-counts"], staleTime: 60 * 60 * 1000, queryFn: async () => {
    const { data, error } = await supabase.rpc("get_module_counts");
    if (error) throw error;
    return data || [];
  } });
}