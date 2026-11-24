import { useNavigate, useLocation } from "react-router-dom";
import { Heart, Sparkles, BookOpen, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { path: "/", icon: Heart, label: "Discover", area: "kit-area-discover" },
  { path: "/likes", icon: Sparkles, label: "Connects", area: "kit-area-likes" },
  { path: "/learn", icon: BookOpen, label: "Learn", area: "kit-area-learn" },
  { path: "/messages", icon: MessageCircle, label: "Chat", area: "kit-area-chat" },
  { path: "/profile", icon: User, label: "Profile", area: "kit-area-profile" },
];



export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tapped, setTapped] = useState<string | null>(null);
  const { unreadCount } = useUnreadMessages();
  const reducedMotion = useReducedMotion();
  const qc = useQueryClient();

  const prefetchMessages = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    qc.prefetchQuery({
      queryKey: ["matches-list", session.user.id],
      queryFn: async () => {
        const { data } = await supabase
          .from("matches")
          .select("id, user1_id, user2_id")
          .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`);
        return data || [];
      },
      staleTime: 60 * 1000,
    });
  }, [qc]);

  const prefetchLearn = useCallback(async () => {
    qc.prefetchQuery({
      queryKey: ["education-modules"],
      queryFn: async () => {
        const { data } = await supabase
          .from("education_modules")
          .select("id, slug, title, description, order_index, tier, badge_number, estimated_minutes")
          .order("order_index")
          .limit(6);
        return data || [];
      },
      staleTime: 30 * 60 * 1000,
    });
  }, [qc]);

  const handleTap = (path: string) => {
    setTapped(path);
    // Prefetch data for the target page
    if (path === "/messages") prefetchMessages();
    if (path === "/learn") prefetchLearn();
    navigate(path);
    setTimeout(() => setTapped(null), 200);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-[max(0.5rem,env(safe-area-inset-bottom))]" aria-label="Main navigation" role="navigation" data-walkthrough="bottom-nav" data-tour="bottom-nav">
      <div className="container max-w-md mx-auto px-2 pt-1.5 pb-0.5 flex justify-around">
        {navItems.map(({ path, icon: Icon, label, area }) => {
          const isActive = location.pathname === path;
          const isTapped = tapped === path;
          const showBadge = path === "/messages" && unreadCount > 0;
          return (
            <button
              key={path}
              type="button"
              onClick={() => handleTap(path)}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={cn("kit-nav-item", area, isTapped && !reducedMotion && "animate-tab-bounce")}
            >
              <span className="kit-nav-pill">
                <Icon aria-hidden="true" strokeWidth={isActive ? 2.5 : 2} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center ring-2 ring-card" aria-label={`${unreadCount} unread messages`}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
              <span aria-hidden="true">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
