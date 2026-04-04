import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CrossAppLink {
  platform: string;
  username: string;
  url: string;
  verified: boolean;
}

export const SUPPORTED_PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: "📷", color: "#E4405F", urlPattern: "https://instagram.com/{username}" },
  { id: "twitter", label: "Twitter/X", icon: "𝕏", color: "#000000", urlPattern: "https://twitter.com/{username}" },
  { id: "fetlife", label: "FetLife", icon: "❤️", color: "#C20000", urlPattern: "https://fetlife.com/{username}" },
  { id: "reddit", label: "Reddit", icon: "🤖", color: "#FF4500", urlPattern: "https://reddit.com/u/{username}" },
  { id: "tiktok", label: "TikTok", icon: "🎵", color: "#25F4EE", urlPattern: "https://tiktok.com/@{username}" },
  { id: "threads", label: "Threads", icon: "@", color: "#000000", urlPattern: "https://threads.net/@{username}" },
  { id: "bluesky", label: "Bluesky", icon: "🦋", color: "#1185FE", urlPattern: "https://bsky.app/profile/{username}" },
  { id: "website", label: "Personal Site", icon: "🌐", color: "#7C3AED", urlPattern: "{username}" },
] as const;

export const buildUrl = (platformId: string, username: string): string => {
  const platform = SUPPORTED_PLATFORMS.find(p => p.id === platformId);
  if (!platform) return username;
  if (platformId === "website") return username.startsWith("http") ? username : `https://${username}`;
  return platform.urlPattern.replace("{username}", username);
};

export const useCrossAppLinks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["cross-app-links", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("cross_app_links")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return (data?.cross_app_links || []) as unknown as CrossAppLink[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const updateLinks = useMutation({
    mutationFn: async (newLinks: CrossAppLink[]) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ cross_app_links: newLinks as any })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cross-app-links"] }),
  });

  return { links, isLoading, updateLinks };
};

export const useCrossAppLinksProfile = (userId: string) => {
  return useQuery({
    queryKey: ["cross-app-links-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("cross_app_links")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return (data?.cross_app_links || []) as unknown as CrossAppLink[];
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });
};
