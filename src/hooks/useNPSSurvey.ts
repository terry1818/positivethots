import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";

type TriggerEvent = "day_7" | "first_match" | "day_30" | "day_60";

const SUPPRESSED_ROUTES = ["/onboarding", "/auth", "/chat/"];
const COOLDOWN_DAYS = 14;

export function useNPSSurvey() {
  const { user } = useAuth();
  const location = useLocation();
  const [pendingTrigger, setPendingTrigger] = useState<TriggerEvent | null>(null);

  const evaluate = useCallback(async () => {
    if (!user) return;

    // Suppress on certain routes
    if (SUPPRESSED_ROUTES.some((r) => location.pathname.startsWith(r))) return;

    // Fetch existing responses
    const { data: existing } = await supabase
      .from("nps_responses" as any)
      .select("trigger_event, created_at")
      .eq("user_id", user.id);

    const responded = new Set((existing as any[] || []).map((r: any) => r.trigger_event));

    // Check cooldown — no NPS within last 14 days
    const lastResponse = (existing as any[] || [])
      .map((r: any) => new Date(r.created_at).getTime())
      .sort((a: number, b: number) => b - a)[0];

    if (lastResponse && Date.now() - lastResponse < COOLDOWN_DAYS * 86400000) return;

    // Get profile created_at
    const { data: profile } = await supabase
      .from("profiles")
      .select("created_at")
      .eq("id", user.id)
      .single();

    if (!profile) return;
    const accountAgeDays = (Date.now() - new Date(profile.created_at).getTime()) / 86400000;

    // Check triggers in priority order
    const triggers: { event: TriggerEvent; condition: boolean }[] = [
      { event: "day_7", condition: accountAgeDays >= 7 },
      { event: "first_match", condition: false }, // checked separately below
      { event: "day_30", condition: accountAgeDays >= 30 },
      { event: "day_60", condition: accountAgeDays >= 60 },
    ];

    // Check first match trigger
    if (!responded.has("first_match")) {
      const { count } = await supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (count && count > 0) {
        // Check if match is recent (within 1 hour) for first-match trigger
        const { data: recentMatch } = await supabase
          .from("matches")
          .select("created_at")
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order("created_at", { ascending: true })
          .limit(1)
          .single();

        if (recentMatch) {
          const matchAge = Date.now() - new Date(recentMatch.created_at).getTime();
          // Show within 1 hour of first match, or after 1 day if they missed the window
          if (matchAge < 3600000 || matchAge > 86400000) {
            triggers[1] = { event: "first_match", condition: true };
          }
        }
      }
    }

    for (const t of triggers) {
      if (t.condition && !responded.has(t.event)) {
        setPendingTrigger(t.event);
        return;
      }
    }
  }, [user, location.pathname]);

  useEffect(() => {
    const timeout = setTimeout(evaluate, 3000); // Delay to not interrupt UX
    return () => clearTimeout(timeout);
  }, [evaluate]);

  const dismiss = useCallback(() => setPendingTrigger(null), []);

  return { pendingTrigger, dismiss };
}
