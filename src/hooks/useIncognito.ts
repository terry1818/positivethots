import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

export const useIncognito = () => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const queryClient = useQueryClient();

  const incognitoQuery = useQuery({
    queryKey: ["incognito", user?.id],
    queryFn: async () => {
      if (!user) return { incognito_mode: false, incognito_exceptions: [] };
      const { data, error } = await supabase
        .from("profiles")
        .select("incognito_mode, incognito_exceptions")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data as { incognito_mode: boolean; incognito_exceptions: string[] | null };
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const isIncognito = incognitoQuery.data?.incognito_mode ?? false;
  const exceptions = (incognitoQuery.data?.incognito_exceptions as string[]) || [];

  const toggleIncognito = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!isPremium && enabled) throw new Error("Premium required");

      let autoExceptions: string[] = [];
      if (enabled) {
        // Auto-add matches and linked partners
        const [matchesRes, linksRes] = await Promise.all([
          supabase.from("matches").select("user1_id, user2_id")
            .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`),
          supabase.from("partner_links").select("requester_id, partner_id")
            .or(`requester_id.eq.${user!.id},partner_id.eq.${user!.id}`)
            .eq("status", "accepted"),
        ]);

        const matchIds = (matchesRes.data || []).map(m =>
          m.user1_id === user!.id ? m.user2_id : m.user1_id
        );
        const partnerIds = (linksRes.data || []).map(l =>
          l.requester_id === user!.id ? l.partner_id : l.requester_id
        );
        autoExceptions = [...new Set([...matchIds, ...partnerIds])];
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          incognito_mode: enabled,
          incognito_updated_at: new Date().toISOString(),
          incognito_exceptions: enabled ? autoExceptions : [],
        })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ["incognito"] });
      toast.success(enabled ? "You're now invisible 👻" : "You're visible again");
    },
    onError: (err: any) => {
      if (err.message === "Premium required") {
        toast.error("Upgrade to Premium to use Incognito Mode");
      } else {
        toast.error("Failed to update incognito mode");
      }
    },
  });

  const addException = useMutation({
    mutationFn: async (userId: string) => {
      const current = [...exceptions, userId];
      const { error } = await supabase
        .from("profiles")
        .update({ incognito_exceptions: current })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incognito"] });
    },
  });

  const removeException = useMutation({
    mutationFn: async (userId: string) => {
      const current = exceptions.filter(id => id !== userId);
      const { error } = await supabase
        .from("profiles")
        .update({ incognito_exceptions: current })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incognito"] });
    },
  });

  return {
    isIncognito,
    exceptions,
    isLoading: incognitoQuery.isLoading,
    isPremium,
    toggleIncognito,
    addException,
    removeException,
  };
};
