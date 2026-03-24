import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";

interface ContinueData {
  moduleSlug: string;
  moduleTitle: string;
  sectionTitle: string;
  sectionNumber: number;
  totalSections: number;
  completedSections: number;
}

export const ContinueLearning = () => {
  const [data, setData] = useState<ContinueData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadContinueData();
  }, []);

  const loadContinueData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Find the most recently accessed section progress
    const { data: recentProgress } = await supabase
      .from("user_section_progress")
      .select("section_id, completed, last_accessed")
      .eq("user_id", session.user.id)
      .order("last_accessed", { ascending: false })
      .limit(1);

    if (!recentProgress || recentProgress.length === 0) return;

    const sectionId = recentProgress[0].section_id;

    // Get the section and its module
    const { data: section } = await supabase
      .from("module_sections")
      .select("*, education_modules!inner(slug, title)")
      .eq("id", sectionId)
      .single();

    if (!section) return;

    const moduleData = (section as any).education_modules;

    // Get all sections for this module to calculate progress
    const { data: allSections } = await supabase
      .from("module_sections")
      .select("id")
      .eq("module_id", section.module_id);

    const { data: completedProgress } = await supabase
      .from("user_section_progress")
      .select("section_id")
      .eq("user_id", session.user.id)
      .eq("completed", true)
      .in("section_id", (allSections || []).map(s => s.id));

    const totalSections = allSections?.length || 0;
    const completedSections = completedProgress?.length || 0;

    // Check if badge is earned for this module
    const { data: badge } = await supabase
      .from("user_badges")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("module_id", section.module_id)
      .maybeSingle();

    // If this module is 100% complete AND badge earned, try to find the next incomplete module
    if (totalSections > 0 && completedSections >= totalSections && badge) {
      // Find next incomplete module by looking for modules without badges
      const { data: allModules } = await supabase
        .from("education_modules")
        .select("id, slug, title")
        .order("order_index");

      const { data: allBadges } = await supabase
        .from("user_badges")
        .select("module_id")
        .eq("user_id", session.user.id);

      const earnedIds = new Set((allBadges || []).map(b => b.module_id));
      const nextModule = (allModules || []).find(m => !earnedIds.has(m.id));

      if (!nextModule) {
        // All modules complete — don't show the card
        return;
      }

      // Get sections for the next module
      const { data: nextSections } = await supabase
        .from("module_sections")
        .select("id, section_number, title")
        .eq("module_id", nextModule.id)
        .order("section_number")
        .limit(1);

      const { data: nextModuleSectionsAll } = await supabase
        .from("module_sections")
        .select("id")
        .eq("module_id", nextModule.id);

      const { data: nextCompleted } = await supabase
        .from("user_section_progress")
        .select("section_id")
        .eq("user_id", session.user.id)
        .eq("completed", true)
        .in("section_id", (nextModuleSectionsAll || []).map(s => s.id));

      setData({
        moduleSlug: nextModule.slug,
        moduleTitle: nextModule.title,
        sectionTitle: nextSections?.[0]?.title || "Section 1",
        sectionNumber: nextSections?.[0]?.section_number || 1,
        totalSections: nextModuleSectionsAll?.length || 0,
        completedSections: nextCompleted?.length || 0,
      });
      return;
    }

    setData({
      moduleSlug: moduleData.slug,
      moduleTitle: moduleData.title,
      sectionTitle: section.title,
      sectionNumber: section.section_number,
      totalSections,
      completedSections,
    });
  };

  if (!data) return null;

  const progressPercent = data.totalSections > 0
    ? Math.round((data.completedSections / data.totalSections) * 100)
    : 0;

  return (
    <Card className="bg-gradient-to-br from-primary/15 to-accent/15 border-primary/20 animate-fade-in overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Progress ring */}
          <div className="relative shrink-0">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
              <circle
                cx="28" cy="28" r="24" fill="none"
                stroke="hsl(var(--primary))" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${(progressPercent / 100) * 150.8} 150.8`}
                transform="rotate(-90 28 28)"
                className="transition-all duration-1000"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
              {progressPercent}%
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Continue where you left off</p>
            <h3 className="font-bold text-sm truncate">{data.moduleTitle}</h3>
            <p className="text-xs text-muted-foreground truncate">
              Section {data.sectionNumber}: {data.sectionTitle}
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => navigate(`/learn/${data.moduleSlug}`)}
            className="shrink-0 gap-1"
          >
            <PlayCircle className="h-4 w-4" />
            Go
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
