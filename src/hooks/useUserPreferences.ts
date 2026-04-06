import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// In-memory cache so we don't query Supabase on every read
const prefsCache = new Map<string, any>();

export function useUserPreferences() {
  const { user } = useAuth();
  const userId = user?.id;

  const getPreference = useCallback(
    async <T = any>(key: string, defaultValue: T): Promise<T> => {
      const cacheKey = `${userId}:${key}`;
      if (prefsCache.has(cacheKey)) return prefsCache.get(cacheKey) as T;

      if (!userId) return defaultValue;

      const { data, error } = await supabase
        .from("user_preferences" as any)
        .select("value")
        .eq("user_id", userId)
        .eq("key", key)
        .maybeSingle();

      if (error || !data) return defaultValue;
      const val = (data as any).value;
      prefsCache.set(cacheKey, val);
      return val as T;
    },
    [userId]
  );

  const setPreference = useCallback(
    async (key: string, value: any): Promise<void> => {
      if (!userId) return;
      const cacheKey = `${userId}:${key}`;
      prefsCache.set(cacheKey, value);

      await supabase.from("user_preferences" as any).upsert(
        {
          user_id: userId,
          key,
          value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,key" }
      );
    },
    [userId]
  );

  const clearCache = useCallback(() => {
    if (!userId) return;
    for (const key of prefsCache.keys()) {
      if (key.startsWith(`${userId}:`)) prefsCache.delete(key);
    }
  }, [userId]);

  return { getPreference, setPreference, clearCache };
}
