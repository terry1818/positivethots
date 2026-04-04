import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface VideoDateEvent {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  round_duration_seconds: number;
  max_participants: number;
  status: string;
  education_tier_required: number;
  created_at: string;
}

export interface VideoDateParticipant {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  matches_found: number;
  registered_at: string;
}

export interface VideoDateRound {
  id: string;
  event_id: string;
  round_number: number;
  user_a: string;
  user_b: string;
  started_at: string | null;
  ended_at: string | null;
  user_a_interest: boolean | null;
  user_b_interest: boolean | null;
  is_match: boolean;
}

export const useVideoDateEvents = () => {
  return useQuery({
    queryKey: ["video-date-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_date_events")
        .select("*")
        .in("status", ["upcoming", "active"])
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as VideoDateEvent[];
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useVideoDateRegistration = (eventId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: registration, isLoading } = useQuery({
    queryKey: ["video-date-registration", eventId, user?.id],
    queryFn: async () => {
      if (!user?.id || !eventId) return null;
      const { data, error } = await supabase
        .from("video_date_participants")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as VideoDateParticipant | null;
    },
    enabled: !!user?.id && !!eventId,
  });

  const { data: participantCount = 0 } = useQuery({
    queryKey: ["video-date-participant-count", eventId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("video_date_participants")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!eventId,
  });

  const register = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("video_date_participants")
        .insert({ event_id: eventId, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-date-registration", eventId] });
      queryClient.invalidateQueries({ queryKey: ["video-date-participant-count", eventId] });
    },
  });

  return {
    registration,
    isRegistered: !!registration,
    isLoading,
    participantCount,
    register,
  };
};

export const useVideoDateRounds = (eventId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["video-date-rounds", eventId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("video_date_rounds")
        .select("*")
        .eq("event_id", eventId)
        .order("round_number", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as VideoDateRound[];
    },
    enabled: !!user?.id && !!eventId,
  });
};
