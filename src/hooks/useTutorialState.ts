import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Manages tutorial seen/unseen state with database persistence.
 * @param key Tutorial identifier (e.g. "learn_tour", "likes_tour")
 */
export function useTutorialState(key: string) {
  const [seen, setSeen] = useState(false);

  // Sync from database on mount
  useEffect(() => {
    if (seen) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("tutorials_completed")
          .eq("id", user.id)
          .single();
        if (cancelled) return;
        const completed: string[] = (profile as any)?.tutorials_completed || [];
        if (completed.includes(key)) {
          setSeen(true);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [key, seen]);

  const markSeen = useCallback(async () => {
    setSeen(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc("append_tutorial_completed" as any, { _key: key });
      }
    } catch {}
  }, [key]);

  return { seen, markSeen };
}
