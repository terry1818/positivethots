import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cookie } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/stores/sessionStore";

export const CookieConsent = () => {
  const { user } = useAuth();
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

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-slide-up">
      <Card className="max-w-lg mx-auto p-4 shadow-lg border bg-card max-h-[90vh] overflow-y-auto">
        <div className="flex items-start gap-3">
          <Cookie className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-3">
              We use essential cookies to keep the app running. We don't use tracking cookies or share your data with advertisers.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => respond("accepted")}>Got It</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
