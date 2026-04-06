import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      // Get all user's matches
      const { data: matches } = await supabase
        .from("matches")
        .select("id")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (!matches?.length) return;

      // Get last read timestamps from message_read_receipts table
      const { data: receipts } = await supabase
        .from("message_read_receipts" as any)
        .select("match_id, last_read_at")
        .eq("user_id", user.id);

      const lastReadMap: Record<string, string> = {};
      if (receipts) {
        for (const r of receipts as any[]) {
          lastReadMap[r.match_id] = r.last_read_at;
        }
      }

      let total = 0;
      for (const match of matches) {
        const lastRead = lastReadMap[match.id] || "1970-01-01T00:00:00Z";
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("match_id", match.id)
          .neq("sender_id", user.id)
          .gt("created_at", lastRead);
        total += count || 0;
      }
      setUnreadCount(total);
    };

    fetchUnread();

    // Subscribe to new messages across all matches
    const channel = supabase
      .channel("unread-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          if (payload.new.sender_id !== user.id) {
            setUnreadCount((c) => c + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markRead = async (matchId: string) => {
    if (!user) return;
    const now = new Date().toISOString();

    // Optimistic update
    setUnreadCount((c) => Math.max(0, c - 1));

    // Persist to database
    await supabase.from("message_read_receipts" as any).upsert(
      {
        user_id: user.id,
        match_id: matchId,
        last_read_at: now,
      },
      { onConflict: "user_id,match_id" }
    );
  };

  return { unreadCount, markRead };
};
