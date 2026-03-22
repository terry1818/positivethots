import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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

const TIER_FEATURES: Record<string, { key: string; label: string; description: string; icon: string }[]> = {
  foundation: [
    { key: "discovery", label: "Discovery", description: "Browse and match with other users", icon: "💜" },
    { key: "location_sharing", label: "Location Sharing", description: "Share your GPS at events to find nearby users", icon: "📍" },
    { key: "basic_matching", label: "Basic Matching", description: "Connect with compatible people", icon: "💕" },
  ],
  sexual_health: [
    { key: "sti_sharing", label: "STI Status Sharing", description: "Display verified STI testing info on your profile", icon: "🛡️" },
    { key: "safer_sex_badge", label: "Safer Sex Badge", description: "Show a Safer Sex awareness badge on your profile", icon: "✅" },
  ],
  identity: [
    { key: "advanced_filters", label: "Advanced Filters", description: "Filter by relationship orientation, gender identity & pronouns", icon: "🔍" },
    { key: "profile_linking", label: "Profile Linking", description: "Link profiles with partners publicly", icon: "🔗" },
  ],
  relationships: [
    { key: "priority_matching", label: "Priority Matching", description: "Appear higher in others' Discovery feeds", icon: "⭐" },
    { key: "chat_tools", label: "Conversation Tools", description: "Guided conversation starters & conflict resolution prompts", icon: "💬" },
  ],
  advanced: [
    { key: "mentor_badge", label: "Mentor Badge", description: "Visible Mentor role on your profile", icon: "🎓" },
    { key: "event_creation", label: "Event Creation", description: "Host and create community events", icon: "🎉" },
    { key: "premium_content", label: "Premium Content", description: "Access exclusive content without a subscription", icon: "👑" },
  ],
};

const TIER_LABELS: Record<string, string> = {
  foundation: "Foundation",
  sexual_health: "Sexual Health",
  identity: "Identity & Diversity",
  relationships: "Healthy Relationships",
  advanced: "Advanced Topics",
};

const TIER_ORDER = ["foundation", "sexual_health", "identity", "relationships", "advanced"];

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
      const tierResults: TierUnlock[] = TIER_ORDER.map((tier) => {
        const tierModules = modules.filter((m) => m.tier === tier);
        const earned = tierModules.filter((m) => earnedIds.has(m.id)).length;
        const isComplete = tierModules.length > 0 && earned === tierModules.length;

        const features: FeatureUnlock[] = (TIER_FEATURES[tier] || []).map((f) => {
          const unlocked = isComplete;
          featureMap[f.key] = unlocked;
          return { ...f, isUnlocked: unlocked, requiredTier: tier };
        });

        return {
          tier,
          label: TIER_LABELS[tier] || tier,
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
