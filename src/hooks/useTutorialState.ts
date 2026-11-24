import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Which tours a member has finished.
 *
 * The answer lives in `profiles.tutorials_completed` and is mirrored on the device so a returning
 * member is recognised before the network answers. Until the answer is known, `seen` is true:
 * a tour only opens once we are sure the member has not finished it. (It used to start as false,
 * so every page opened its tour on each visit while the saved answer was still loading.)
 */

const CACHE_KEY = "pt_tutorials_seen";

type Cache = { uid: string; keys: string[] };

const readCache = (uid: string): string[] => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "null") as Cache | null;
    return cache && cache.uid === uid && Array.isArray(cache.keys) ? cache.keys : [];
  } catch {
    return [];
  }
};

const writeCache = (uid: string, keys: string[]) => {
  try {
    const merged = Array.from(new Set([...readCache(uid), ...keys]));
    localStorage.setItem(CACHE_KEY, JSON.stringify({ uid, keys: merged } satisfies Cache));
  } catch {
    // Storage can be unavailable (private browsing); the database still holds the answer.
  }
};

type TutorialStatus = "unknown" | "seen" | "unseen";

/**
 * @param key Tutorial identifier (e.g. "learn_tour", "likes_tour")
 * @returns `seen` (true until we know otherwise), `ready` (the answer is known) and `markSeen`.
 */
export function useTutorialState(key: string) {
  const [status, setStatus] = useState<TutorialStatus>("unknown");

  useEffect(() => {
    let cancelled = false;
    setStatus("unknown");
    (async () => {
      try {
        // getSession reads the saved sign-in from the device; no network round trip.
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user || cancelled) return;
        if (readCache(user.id).includes(key)) {
          setStatus("seen");
          return;
        }
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("tutorials_completed")
          .eq("id", user.id)
          .single();
        // If the check fails, stay "unknown": better to skip a tour than to repeat it.
        if (cancelled || error || !profile) return;
        const completed: string[] = (profile as any)?.tutorials_completed || [];
        if (completed.length > 0) writeCache(user.id, completed);
        setStatus(completed.includes(key) ? "seen" : "unseen");
      } catch {
        // Stay "unknown".
      }
    })();
    return () => { cancelled = true; };
  }, [key]);

  const markSeen = useCallback(async () => {
    setStatus("seen");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      writeCache(user.id, [key]);
      await supabase.rpc("append_tutorial_completed" as any, { _key: key });
    } catch {
      // The device copy is already written; the server copy is retried the next time a tour ends.
    }
  }, [key]);

  return { seen: status !== "unseen", ready: status !== "unknown", markSeen };
}
