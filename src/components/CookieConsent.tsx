import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cookie } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/stores/sessionStore";
import { useLocation } from "react-router-dom";

export const CookieConsent = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // If already dismissed in this session, don't show
    if (useSessionStore.getState().isBannerDismissed("cookie_consent")) return;

    if (!user) {
      // No user logged in — show consent (can't check DB)
      setVisible(true);
      return;
    }

    // Check DB for saved consent
    (async () => {
      const { data } = await supabase
        .from("user_preferences" as any)
        .select("value")
        .eq("user_id", user.id)
        .eq("key", "cookie_consent")
        .maybeSingle();
      if (!data) setVisible(true);
    })();
  }, [user]);

  const respond = async (choice: "accepted" | "declined") => {
    useSessionStore.getState().dismissBanner("cookie_consent");
    setVisible(false);
    if (user) {
      await supabase.from("user_preferences" as any).upsert(
        { user_id: user.id, key: "cookie_consent", value: choice, updated_at: new Date().toISOString() },
        { onConflict: "user_id,key" }
      );
    }
  };

  if (!visible || /^\/learn\/[^/]+\/?$/.test(pathname)) return null;

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 p-2">
      <Card className="max-w-md mx-auto p-2 shadow-lg border bg-card">
        <div className="flex items-center gap-2">
          <Cookie className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">
              Essential cookies only. No advertising or tracking.
            </p>
          </div>
          <Button size="sm" className="shrink-0 min-h-11" onClick={() => respond("accepted")}>Got It</Button>
        </div>
      </Card>
    </div>
  );
};
