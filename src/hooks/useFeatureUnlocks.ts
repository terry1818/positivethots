import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LEARN_SECTIONS } from "@/lib/learnSections";

export interface TierUnlock {
  tier: string;
  label: string;
  totalModules: number;
  earnedModules: number;
  isComplete: boolean;
  features: FeatureUnlock[];
}

export interface FeatureUnlock {
  key: string;
  label: string;
  description: string;
  icon: string; // emoji for simplicity
  isUnlocked: boolean;
  requiredTier: string;
}

// Which features each section unlocks, its name and the order all live in src/lib/learnSections.ts.

export const useFeatureUnlocks = () => {
  const [tiers, setTiers] = useState<TierUnlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [allFeatures, setAllFeatures] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const [modulesResult, badgesResult] = await Promise.all([
        supabase.from("education_modules").select("id, tier").order("order_index"),
        supabase.from("user_badges").select("module_id").eq("user_id", session.user.id),
      ]);

      const modules = modulesResult.data || [];
      const earnedIds = new Set((badgesResult.data || []).map((b) => b.module_id));

      const featureMap: Record<string, boolean> = {};
      // A section with no modules yet is left out: it cannot be finished and has nothing to show.
      const tierResults: TierUnlock[] = LEARN_SECTIONS.filter((sec) => modules.some((m) => m.tier === sec.id)).map(({ id: tier, name, features: sectionFeatures }) => {
        const tierModules = modules.filter((m) => m.tier === tier);
        const earned = tierModules.filter((m) => earnedIds.has(m.id)).length;
        const isComplete = tierModules.length > 0 && earned === tierModules.length;

        const features: FeatureUnlock[] = sectionFeatures.map((f) => {
          const unlocked = isComplete;
          featureMap[f.key] = unlocked;
          return { ...f, isUnlocked: unlocked, requiredTier: tier };
        });

        return {
          tier,
          label: name,
          totalModules: tierModules.length,
          earnedModules: earned,
          isComplete,
          features,
        };
      });

      setTiers(tierResults);
      setAllFeatures(featureMap);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const isFeatureUnlocked = (key: string): boolean => allFeatures[key] ?? false;

  return { tiers, loading, isFeatureUnlocked, allFeatures, reload: load };
};
