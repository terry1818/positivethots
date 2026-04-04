import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Manages tutorial seen/unseen state with localStorage + database persistence.
 * @param key Tutorial identifier (e.g. "learn_tour", "likes_tour")
 */
export function useTutorialState(key: string) {
  const storageKey = `pt_tutorial_${key}`;

  const [seen, setSeen] = useState(() => {
    return localStorage.getItem(storageKey) === "true";
  });

  // Sync from database on mount (in case user switched devices)
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
          localStorage.setItem(storageKey, "true");
          setSeen(true);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [key, storageKey, seen]);

  const markSeen = useCallback(async () => {
    localStorage.setItem(storageKey, "true");
    setSeen(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc("append_tutorial_completed" as any, { _key: key });
      }
    } catch {}
  }, [key, storageKey]);

  return { seen, markSeen };
}
