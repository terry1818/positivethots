import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cookie } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/stores/sessionStore";
import { useLocation } from "react-router-dom";

// The answer is kept on the device as well as in the member's account, so the notice is not
// repeated while sign-in is still loading or when the account lookup is slow or fails.
const LOCAL_KEY = "pt_cookie_consent";

const readLocalChoice = (): string | null => {
  try {
    return localStorage.getItem(LOCAL_KEY);
  } catch {
    return null;
  }
};

const writeLocalChoice = (choice: string) => {
  try {
    localStorage.setItem(LOCAL_KEY, choice);
  } catch {
    // Storage can be unavailable (private browsing); the account copy still holds the answer.
  }
};

export const CookieConsent = () => {
  const { user, loading: authLoading } = useAuth();
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Wait until we know whether someone is signed in. Showing the notice before that is what
    // made it reappear on every visit for members who had already answered.
    if (authLoading) return;

    if (useSessionStore.getState().isBannerDismissed("cookie_consent") || readLocalChoice()) {
      setVisible(false);
      return;
    }

    if (!user) {
      setVisible(true);
      return;
    }

    // Signed in on a device with no saved answer: ask the account.
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("user_preferences" as any)
        .select("value")
        .eq("user_id", user.id)
        .eq("key", "cookie_consent")
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        writeLocalChoice(String((data as any).value ?? "accepted"));
        setVisible(false);
      } else if (!error) {
        setVisible(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  const respond = async (choice: "accepted" | "declined") => {
    useSessionStore.getState().dismissBanner("cookie_consent");
    writeLocalChoice(choice);
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
