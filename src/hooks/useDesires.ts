import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DesireOption {
  id: string;
  category: string;
  label: string;
  emoji: string | null;
  description: string | null;
  requires_education_tier: number;
  display_order: number;
}

export interface UserDesire {
  id: string;
  user_id: string;
  desire_id: string;
  visibility: string;
  priority: number;
  desire?: DesireOption;
}

export const DESIRE_CATEGORIES = [
  "Relationship Style",
  "Dating Preference",
  "Intimacy",
  "Kink",
  "Lifestyle",
  "Boundary",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  "Relationship Style": "bg-primary text-primary-foreground",
  "Dating Preference": "bg-pink-600 text-white",
  "Intimacy": "bg-fuchsia-600 text-white",
  "Kink": "bg-red-600 text-white",
  "Lifestyle": "bg-blue-600 text-white",
  "Boundary": "bg-orange-600 text-white",
};

export const useDesireOptions = () => {
  return useQuery({
    queryKey: ["desire-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("desire_options")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as DesireOption[];
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const useUserDesires = (userId?: string) => {
  const { user } = useAuth();
  const targetId = userId || user?.id;

  return useQuery({
    queryKey: ["user-desires", targetId],
    queryFn: async () => {
      if (!targetId) return [];
      const { data, error } = await supabase
        .from("user_desires")
        .select("*, desire_options(*)")
        .eq("user_id", targetId);
      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        desire: d.desire_options as unknown as DesireOption,
      })) as UserDesire[];
    },
    enabled: !!targetId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useDesireMutations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const toggleDesire = useMutation({
    mutationFn: async ({ desireId, selected }: { desireId: string; selected: boolean }) => {
      if (selected) {
        const { error } = await supabase.from("user_desires").insert({
          user_id: user!.id,
          desire_id: desireId,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_desires")
          .delete()
          .eq("user_id", user!.id)
          .eq("desire_id", desireId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-desires", user?.id] });
    },
    onError: () => toast.error("Failed to update desires"),
  });

  const updatePriority = useMutation({
    mutationFn: async ({ desireId, priority }: { desireId: string; priority: number }) => {
      const { error } = await supabase
        .from("user_desires")
        .update({ priority, updated_at: new Date().toISOString() })
        .eq("user_id", user!.id)
        .eq("desire_id", desireId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-desires", user?.id] });
    },
  });

  const updateVisibility = useMutation({
    mutationFn: async ({ desireId, visibility }: { desireId: string; visibility: string }) => {
      const { error } = await supabase
        .from("user_desires")
        .update({ visibility, updated_at: new Date().toISOString() })
        .eq("user_id", user!.id)
        .eq("desire_id", desireId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-desires", user?.id] });
    },
  });

  return { toggleDesire, updatePriority, updateVisibility };
};
