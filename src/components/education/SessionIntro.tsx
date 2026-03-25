import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { EducationBadge } from "@/components/EducationBadge";
import { Clock, Zap, BookOpen } from "lucide-react";

interface SessionIntroProps {
  moduleTitle: string;
  sectionTitle: string;
  estimatedMinutes: number | null;
  xpAvailable: number;
  sectionNumber: number;
  totalSections: number;
  onStart: () => void;
  badgeSlug: string;
  badgeTier: string;
}

export const SessionIntro = ({
  moduleTitle,
  sectionTitle,
  estimatedMinutes,
  xpAvailable,
  sectionNumber,
  totalSections,
  onStart,
  badgeSlug,
  badgeTier,
}: SessionIntroProps) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onStart, 3000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onStart]);

  const handleStart = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onStart();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center animate-fade-in">
      <div className="text-center space-y-6 px-6 max-w-sm">
        <EducationBadge
          moduleSlug={badgeSlug}
          title={moduleTitle}
          isEarned={false}
          tier={badgeTier}
          size="lg"
        />

        <div>
          <p className="text-sm text-muted-foreground mb-1">{moduleTitle}</p>
          <h1 className="text-2xl font-bold">{sectionTitle}</h1>
        </div>

        <div className="flex justify-center gap-3">
          {estimatedMinutes && (
            <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full text-sm">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              ~{estimatedMinutes} min
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-accent/10 text-accent px-3 py-1.5 rounded-full text-sm font-medium">
            <Zap className="h-3.5 w-3.5" />
            +{xpAvailable} XP
          </div>
          <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full text-sm">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
            {sectionNumber}/{totalSections}
          </div>
        </div>

        <Button onClick={handleStart} size="lg" className="w-full">
          Start Learning →
        </Button>
      </div>
    </div>
  );
};
