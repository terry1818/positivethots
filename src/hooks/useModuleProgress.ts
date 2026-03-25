import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Section {
  id: string;
  module_id: string;
  section_number: number;
  title: string;
  content_type: string;
  content_text: string | null;
  content_url: string | null;
  estimated_minutes: number | null;
  reflection_prompt: string | null;
}

interface SectionProgress {
  section_id: string;
  completed: boolean;
  time_spent_seconds: number;
}

export const useModuleProgress = (moduleId: string) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [progress, setProgress] = useState<SectionProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  const loadData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: sectionsData } = await supabase
        .from("module_sections")
        .select("*")
        .eq("module_id", moduleId)
        .order("section_number");

      setSections(sectionsData || []);

      if (sectionsData && sectionsData.length > 0) {
        const sectionIds = sectionsData.map(s => s.id);
        const { data: progressData } = await supabase
          .from("user_section_progress")
          .select("section_id, completed, time_spent_seconds")
          .eq("user_id", session.user.id)
          .in("section_id", sectionIds);

        setProgress(progressData || []);
      }
    } catch (error) {
      console.error("Error loading module progress:", error);
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-save timer
  useEffect(() => {
    if (sections.length === 0) return;

    timerRef.current = setInterval(async () => {
      elapsedRef.current += 30;
      const currentSection = sections[currentSectionIndex];
      if (!currentSection) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase
        .from("user_section_progress")
        .upsert({
          user_id: session.user.id,
          section_id: currentSection.id,
          time_spent_seconds: elapsedRef.current,
          last_accessed: new Date().toISOString(),
        }, { onConflict: "user_id,section_id" });
    }, 30000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sections, currentSectionIndex]);

  const markComplete = useCallback(async (sectionId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase
      .from("user_section_progress")
      .upsert({
        user_id: session.user.id,
        section_id: sectionId,
        completed: true,
        time_spent_seconds: elapsedRef.current,
        last_accessed: new Date().toISOString(),
      }, { onConflict: "user_id,section_id" });

    setProgress(prev => {
      const existing = prev.find(p => p.section_id === sectionId);
      if (existing) {
        return prev.map(p => p.section_id === sectionId ? { ...p, completed: true } : p);
      }
      return [...prev, { section_id: sectionId, completed: true, time_spent_seconds: 0 }];
    });

    elapsedRef.current = 0;
  }, []);

  const completedCount = progress.filter(p => p.completed).length;
  const isAllComplete = sections.length > 0 && completedCount >= sections.length;
  const rawPercent = sections.length > 0 ? Math.round((completedCount / sections.length) * 100) : 0;
  const completionPercent = rawPercent >= 100 ? 90 : rawPercent;

  return {
    sections,
    progress,
    loading,
    currentSectionIndex,
    setCurrentSectionIndex,
    markComplete,
    isAllComplete,
    completedCount,
    completionPercent,
    hasSections: sections.length > 0,
    reload: loadData,
  };
};
