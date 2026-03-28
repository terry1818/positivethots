import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, BookOpen, MessageCircle, User, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { path: "/", icon: Heart, label: "Discover" },
  { path: "/likes", icon: Sparkles, label: "Likes" },
  { path: "/learn", icon: BookOpen, label: "Learn" },
  { path: "/events", icon: Calendar, label: "Events" },
  { path: "/messages", icon: MessageCircle, label: "Chat" },
  { path: "/profile", icon: User, label: "Profile" },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tapped, setTapped] = useState<string | null>(null);
  const { unreadCount } = useUnreadMessages();

  const handleTap = (path: string) => {
    setTapped(path);
    navigate(path);
    setTimeout(() => setTapped(null), 200);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card" aria-label="Main navigation" role="navigation">
      <div className="container max-w-md mx-auto px-4 py-2 flex justify-around">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          const isTapped = tapped === path;
          const showBadge = path === "/messages" && unreadCount > 0;
          return (
            <Button
              key={path}
              variant="ghost"
              size="sm"
              onClick={() => handleTap(path)}
              className={cn(
                "flex flex-col items-center gap-0.5 h-auto py-2 px-2 relative transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground",
                isTapped && "animate-tap-bounce"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-[18px] w-[18px] transition-transform duration-200", isActive && "scale-110")} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-medium">{label}</span>
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-gradient-to-r from-primary to-secondary" />
              )}
            </Button>
          );
        })}
      </div>
    </nav>
  );
};
