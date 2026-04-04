import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect } from "react";

export interface GroupChat {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  max_members: number;
  is_active: boolean;
  created_at: string;
  member_count?: number;
  last_message?: { content: string; created_at: string; sender_name: string } | null;
  unread_count?: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  last_read_at: string;
  muted: boolean;
  profile?: {
    id: string;
    name: string;
    display_name: string | null;
    profile_image: string | null;
    is_verified: boolean;
  };
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  metadata: Record<string, unknown>;
  is_flagged: boolean;
  created_at: string;
  sender_profile?: {
    name: string;
    display_name: string | null;
    profile_image: string | null;
  };
}

export const useGroupChats = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const groupsQuery = useQuery({
    queryKey: ["group-chats", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("group_chats")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return (data || []) as GroupChat[];
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  // Realtime subscription for new group messages
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("group-messages-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_messages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["group-chats"] });
        queryClient.invalidateQueries({ queryKey: ["group-messages"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const createGroup = useMutation({
    mutationFn: async ({ name, memberIds }: { name: string; memberIds: string[] }) => {
      // Create the group
      const { data: group, error: groupErr } = await supabase
        .from("group_chats")
        .insert({ name, created_by: user!.id })
        .select()
        .single();
      if (groupErr) throw groupErr;

      // Add creator as admin
      const members = [
        { group_id: group.id, user_id: user!.id, role: "admin" },
        ...memberIds.map(id => ({ group_id: group.id, user_id: id, role: "member" })),
      ];
      const { error: membersErr } = await supabase.from("group_chat_members").insert(members);
      if (membersErr) throw membersErr;

      // System message
      await supabase.from("group_messages").insert({
        group_id: group.id,
        sender_id: user!.id,
        content: "Group created",
        message_type: "system",
      });

      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-chats"] });
      toast.success("Group chat created! 🎉");
    },
    onError: () => toast.error("Failed to create group"),
  });

  return { groups: groupsQuery.data || [], isLoading: groupsQuery.isLoading, createGroup };
};

export const useGroupMessages = (groupId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["group-messages", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_messages")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;

      // Fetch sender profiles
      const senderIds = [...new Set((data || []).map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, display_name, profile_image")
        .in("id", senderIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      return (data || []).map(msg => ({
        ...msg,
        metadata: (msg.metadata || {}) as Record<string, unknown>,
        sender_profile: profileMap.get(msg.sender_id),
      })) as GroupMessage[];
    },
    enabled: !!groupId && !!user,
    staleTime: 10 * 1000,
    refetchInterval: 5000,
  });
};

export const useGroupMembers = (groupId: string) => {
  const { user } = useAuth();

  const membersQuery = useQuery({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_chat_members")
        .select("*")
        .eq("group_id", groupId);
      if (error) throw error;

      const userIds = (data || []).map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, display_name, profile_image, is_verified")
        .in("id", userIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      return (data || []).map(m => ({
        ...m,
        profile: profileMap.get(m.user_id),
      })) as GroupMember[];
    },
    enabled: !!groupId && !!user,
  });

  const currentUserRole = membersQuery.data?.find(m => m.user_id === user?.id)?.role;
  const isAdmin = currentUserRole === "admin";

  return { members: membersQuery.data || [], isLoading: membersQuery.isLoading, isAdmin };
};
