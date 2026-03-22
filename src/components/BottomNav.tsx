import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, BookOpen, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { path: "/", icon: Heart, label: "Discover" },
  { path: "/likes", icon: Sparkles, label: "Likes" },
  { path: "/learn", icon: BookOpen, label: "Learn" },
  { path: "/messages", icon: MessageCircle, label: "Messages" },
  { path: "/profile", icon: User, label: "Profile" },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tapped, setTapped] = useState<string | null>(null);

  const handleTap = (path: string) => {
    setTapped(path);
    navigate(path);
    setTimeout(() => setTapped(null), 200);
  };

  return (
    <nav className="border-t border-border bg-card" aria-label="Main navigation" role="navigation">
      <div className="container max-w-md mx-auto px-4 py-2 flex justify-around">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          const isTapped = tapped === path;
          return (
            <Button
              key={path}
              variant="ghost"
              size="sm"
              onClick={() => handleTap(path)}
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2 px-3 relative transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground",
                isTapped && "animate-tap-bounce"
              )}
            >
              <Icon className={cn("h-5 w-5 transition-transform duration-200", isActive && "scale-110")} />
              <span className="text-[10px] font-medium">{label}</span>
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
