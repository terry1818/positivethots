import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { X, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string | null;
  message: string;
  priority: string;
  target_audience: string;
  starts_at: string;
  expires_at: string | null;
}

const priorityConfig: Record<string, { bg: string; text: string; icon: typeof AlertCircle | null }> = {
  critical: { bg: "bg-red-500", text: "text-white", icon: AlertCircle },
  high: { bg: "bg-amber-500", text: "text-[#1A1A1A]", icon: AlertCircle },
  normal: { bg: "bg-primary", text: "text-primary-foreground", icon: Info },
  low: { bg: "bg-gray-700", text: "text-white", icon: null },
};

export const AnnouncementBanner = () => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const reducedMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());

  const { data: announcements = [] } = useQuery({
    queryKey: ["active-announcements", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const now = new Date().toISOString();

      const { data: allAnnouncements } = await supabase
        .from("announcements")
        .select("id, title, message, priority, target_audience, starts_at, expires_at")
        .eq("is_active", true)
        .lte("starts_at", now)
        .order("created_at", { ascending: false });

      if (!allAnnouncements?.length) return [];

      // Filter by expiry
      const active = allAnnouncements.filter(
        (a: any) => !a.expires_at || new Date(a.expires_at) > new Date()
      );

      // Filter by audience
      const audienceFiltered = active.filter((a: any) => {
        if (a.target_audience === "all") return true;
        if (a.target_audience === "premium") return isPremium;
        if (a.target_audience === "free") return !isPremium;
        return true;
      });

      if (!audienceFiltered.length) return [];

      // Get dismissals
      const { data: dismissals } = await supabase
        .from("announcement_dismissals")
        .select("announcement_id")
        .eq("user_id", user.id);

      const dismissedIds = new Set(dismissals?.map((d: any) => d.announcement_id) || []);

      const undismissed = audienceFiltered.filter((a: any) => !dismissedIds.has(a.id));

      // Sort by priority
      const priorityOrder: Record<string, number> = { critical: 0, high: 1, normal: 2, low: 3 };
      undismissed.sort(
        (a: any, b: any) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
      );

      return undismissed as Announcement[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  const dismissMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      if (!user) return;
      await supabase.from("announcement_dismissals").insert({
        user_id: user.id,
        announcement_id: announcementId,
      });
    },
    onMutate: (id) => {
      setDismissingIds((prev) => new Set(prev).add(id));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["active-announcements"] });
    },
  });

  if (!announcements.length) return null;

  const visible = announcements.filter((a) => !dismissingIds.has(a.id)).slice(0, 2);
  const overflow = announcements.filter((a) => !dismissingIds.has(a.id)).length - 2;

  if (!visible.length) return null;

  return (
    <div className="w-full" role="region" aria-label="Announcements">
      {visible.map((a) => {
        const config = priorityConfig[a.priority] || priorityConfig.normal;
        const Icon = config.icon;
        return (
          <div
            key={a.id}
            className={cn(
              "w-full px-4 py-3 flex items-center gap-3",
              config.bg,
              config.text,
              !reducedMotion && "animate-in slide-in-from-top duration-200"
            )}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
            <div className="flex-1 min-w-0 flex items-center gap-2">
              {a.title && <span className="text-sm font-semibold shrink-0">{a.title}</span>}
              <span className="text-sm truncate">{a.message}</span>
            </div>
            <button
              onClick={() => dismissMutation.mutate(a.id)}
              className="shrink-0 p-2 rounded-sm hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              style={{ minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
              aria-label="Dismiss announcement"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
      {overflow > 0 && (
        <div className="w-full px-4 py-1.5 bg-muted/50 text-center">
          <span className="text-xs text-muted-foreground">
            {overflow} more announcement{overflow > 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
};
