import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface Chapter {
  id: string;
  chapter_type: string;
  title: string;
  content: string;
  custom_icon: string | null;
  is_visible: boolean;
}

interface ChapterProfileViewProps {
  userId: string;
  compact?: boolean;
  maxChapters?: number;
}

export const ChapterProfileView = ({ userId, compact = false, maxChapters }: ChapterProfileViewProps) => {
  const prefersReducedMotion = useReducedMotion();

  const { data: chapters = [] } = useQuery({
    queryKey: ['profile-chapters-view', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_chapters' as any)
        .select('*')
        .eq('user_id', userId)
        .eq('is_visible', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Chapter[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['user-badges-chapter', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_badges')
        .select('module_id, education_modules(title, slug)')
        .eq('user_id', userId);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const displayChapters = chapters.filter(c => c.content.trim().length > 0);
  const limited = maxChapters ? displayChapters.slice(0, maxChapters) : displayChapters;

  if (limited.length === 0) {
    if (compact) return null;
    return (
      <div className="text-center py-6 text-muted-foreground">
        <span className="text-2xl block mb-2">📖</span>
        <p className="text-sm">This person hasn't shared their story yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {limited.map((chapter, index) => (
        <ChapterSection
          key={chapter.id}
          chapter={chapter}
          index={index}
          compact={compact}
          badges={chapter.chapter_type === 'growth_areas' ? badges : []}
          prefersReducedMotion={prefersReducedMotion}
        />
      ))}
      {maxChapters && displayChapters.length > maxChapters && (
        <p className="text-xs text-primary text-center pt-2">
          Read more · {displayChapters.length} chapters
        </p>
      )}
    </div>
  );
};

function ChapterSection({
  chapter, index, compact, badges, prefersReducedMotion,
}: {
  chapter: Chapter;
  index: number;
  compact: boolean;
  badges: any[];
  prefersReducedMotion: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) { setVisible(true); return; }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  return (
    <div
      ref={ref}
      className={cn(
        "py-3 transition-all duration-300",
        !visible && "opacity-0 translate-y-2",
        visible && "opacity-100 translate-y-0",
        index > 0 && "border-t border-white/10"
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">{chapter.custom_icon || '📖'}</span>
        <h4 className="text-sm font-semibold">{chapter.title}</h4>
      </div>
      <p className={cn(
        "text-sm text-muted-foreground leading-relaxed",
        compact && "line-clamp-3"
      )}>
        {chapter.content}
      </p>
      {chapter.chapter_type === 'growth_areas' && badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {badges.map((b: any) => (
            <span key={b.module_id} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {(b.education_modules as any)?.title || 'Badge'}
            </span>
          ))}
        </div>
      )}
      {chapter.chapter_type === 'growth_areas' && badges.length === 0 && (
        <p className="text-xs text-muted-foreground mt-1">🌱 Currently exploring...</p>
      )}
    </div>
  );
}
