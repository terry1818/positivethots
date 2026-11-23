import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { patchSections } from "@/lib/lessonText";
import { saveLessonPosition } from "@/lib/lessonProgress";
import { reportError } from "@/lib/errorReporting";
import { moduleCompletionPercent } from "@/lib/learnSmallFixes";

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
  last_card_index: number;
}

export const useModuleProgress = (moduleId: string) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [progress, setProgress] = useState<SectionProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [badgeEarned, setBadgeEarned] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const isVisibleRef = useRef(true);

  const loadData = useCallback(async () => {
    if (!moduleId) return;
    setLoading(true);
    setError(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: sectionsData, error: sectionError } = await supabase
        .from("module_sections")
        .select("*")
        .eq("module_id", moduleId)
        .order("section_number");

      if (sectionError) throw sectionError;
      setSections(await patchSections(sectionsData || []));
      const { data: badge } = await supabase.from("user_badges").select("id").eq("user_id", session.user.id).eq("module_id", moduleId).maybeSingle();
      setBadgeEarned(!!badge);

      if (sectionsData && sectionsData.length > 0) {
        const sectionIds = sectionsData.map(s => s.id);
        const { data: progressData, error: progressError } = await supabase
          .from("user_section_progress")
          .select("section_id, completed, time_spent_seconds, last_card_index")
          .eq("user_id", session.user.id)
          .in("section_id", sectionIds);

        if (progressError) throw progressError;
        setProgress(progressData || []);
      }
    } catch (error) {
      setError(true);
      console.error("Error loading module progress:", error);
      void reportError(error instanceof Error ? error : new Error("Error loading lesson"));
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Track page visibility for idle detection
  useEffect(() => {
    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Auto-save timer — only counts time when page is visible
  useEffect(() => {
    if (sections.length === 0) return;

    timerRef.current = setInterval(async () => {
      if (!isVisibleRef.current) return;

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
    if (!session) throw new Error("Signed-in session required");

    const { error } = await supabase
      .from("user_section_progress")
      .upsert({
        user_id: session.user.id,
        section_id: sectionId,
        completed: true,
        time_spent_seconds: elapsedRef.current,
        last_accessed: new Date().toISOString(),
      }, { onConflict: "user_id,section_id" });
    if (error) throw error;

    setProgress(prev => {
      const existing = prev.find(p => p.section_id === sectionId);
      if (existing) {
        return prev.map(p => p.section_id === sectionId ? { ...p, completed: true } : p);
      }
      return [...prev, { section_id: sectionId, completed: true, time_spent_seconds: 0, last_card_index: 0 }];
    });

    elapsedRef.current = 0;
  }, []);

  const saveCardPosition = useCallback(async (sectionId: string, index: number) => {
    setProgress(prev => {
      const existing = prev.find(p => p.section_id === sectionId);
      return existing ? prev.map(p => p.section_id === sectionId ? { ...p, last_card_index: index } : p)
        : [...prev, { section_id: sectionId, completed: false, time_spent_seconds: 0, last_card_index: index }];
    });
    const { data: { session } } = await supabase.auth.getSession();
    if (session) saveLessonPosition(session.user.id, sectionId, index);
  }, []);

  const completedCount = progress.filter(p => p.completed).length;
  const isAllComplete = sections.length > 0 && completedCount >= sections.length;
  const completionPercent = moduleCompletionPercent(completedCount, sections.length, badgeEarned);

  return {
    sections,
    progress,
    error,
    saveCardPosition,
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
