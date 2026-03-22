import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface UseRequireAuthOptions {
  requireOnboarding?: boolean;
  requireFoundationBadges?: boolean;
  redirectTo?: string;
}

export const useRequireAuth = (options: UseRequireAuthOptions = {}) => {
  const { requireOnboarding = false, requireFoundationBadges = false, redirectTo = "/auth" } = options;
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate(redirectTo, { replace: true });
      return;
    }

    const check = async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileData) {
        navigate(redirectTo, { replace: true });
        return;
      }

      if (requireOnboarding && !profileData.onboarding_completed) {
        navigate("/onboarding", { replace: true });
        return;
      }

      if (requireFoundationBadges) {
        const [badgesResult, foundationResult] = await Promise.all([
          supabase.from("user_badges").select("module_id").eq("user_id", user.id),
          supabase.from("education_modules").select("id").eq("tier", "foundation").eq("is_required", true),
        ]);
        const badgeCount = badgesResult.data?.length || 0;
        const requiredCount = foundationResult.data?.length || 5;
        if (badgeCount < requiredCount) {
          navigate("/learn", { replace: true });
          return;
        }
      }

      setProfile(profileData);
      setReady(true);
    };

    check();
  }, [user, authLoading]);

  return { user, profile, ready, loading: authLoading || !ready };
};
