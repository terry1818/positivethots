import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PartnerLink {
  id: string;
  requester_id: string;
  partner_id: string;
  status: string;
  relationship_label: string | null;
  visibility: string;
  linked_at: string | null;
  created_at: string;
  partner_profile?: {
    id: string;
    name: string;
    display_name: string | null;
    profile_image: string | null;
    is_verified: boolean;
  };
}

const RELATIONSHIP_LABELS = [
  "Partner", "Nesting Partner", "Anchor Partner", "Primary Partner",
  "Secondary Partner", "Metamour", "Play Partner", "Comet",
  "Life Partner", "Spouse", "Fiancé(e)", "Girlfriend", "Boyfriend",
  "Datemate", "Significant Other", "Paramour", "Lover", "FWB",
  "Situationship", "Queerplatonic Partner", "Triad Member",
  "Quad Member", "Hinge",
];

export { RELATIONSHIP_LABELS };

export const usePartnerLinks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const linksQuery = useQuery({
    queryKey: ["partner-links", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("partner_links")
        .select("*")
        .or(`requester_id.eq.${user.id},partner_id.eq.${user.id}`)
        .in("status", ["pending", "accepted"]);
      if (error) throw error;

      // Fetch partner profiles
      const partnerIds = (data || []).map(l =>
        l.requester_id === user.id ? l.partner_id : l.requester_id
      );
      if (partnerIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, display_name, profile_image, is_verified")
        .in("id", partnerIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      return (data || []).map(link => ({
        ...link,
        partner_profile: profileMap.get(
          link.requester_id === user.id ? link.partner_id : link.requester_id
        ),
      })) as PartnerLink[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const activeLinks = (linksQuery.data || []).filter(l => l.status === "accepted");
  const pendingIncoming = (linksQuery.data || []).filter(
    l => l.status === "pending" && l.partner_id === user?.id
  );
  const pendingOutgoing = (linksQuery.data || []).filter(
    l => l.status === "pending" && l.requester_id === user?.id
  );

  const sendRequest = useMutation({
    mutationFn: async ({ partnerId, label }: { partnerId: string; label: string }) => {
      const { error } = await supabase.from("partner_links").insert({
        requester_id: user!.id,
        partner_id: partnerId,
        relationship_label: label,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-links"] });
      toast.success("Partner link request sent!");
    },
    onError: (err: any) => {
      toast.error(err.message?.includes("Maximum") ? "You've reached the maximum of 5 partner links" : "Failed to send request");
    },
  });

  const respondToRequest = useMutation({
    mutationFn: async ({ linkId, accept }: { linkId: string; accept: boolean }) => {
      const { error } = await supabase
        .from("partner_links")
        .update({
          status: accept ? "accepted" : "declined",
          linked_at: accept ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["partner-links"] });
      toast.success(vars.accept ? "Partner linked! 🎉" : "Request declined");
    },
    onError: () => toast.error("Something went wrong"),
  });

  const updateLink = useMutation({
    mutationFn: async ({ linkId, updates }: { linkId: string; updates: Partial<{ relationship_label: string; visibility: string }> }) => {
      const { error } = await supabase
        .from("partner_links")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-links"] });
      toast.success("Updated!");
    },
  });

  const unlinkPartner = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from("partner_links")
        .update({ status: "removed", updated_at: new Date().toISOString() })
        .eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-links"] });
      toast.success("Partner unlinked");
    },
  });

  return {
    links: linksQuery.data || [],
    activeLinks,
    pendingIncoming,
    pendingOutgoing,
    isLoading: linksQuery.isLoading,
    sendRequest,
    respondToRequest,
    updateLink,
    unlinkPartner,
  };
};
