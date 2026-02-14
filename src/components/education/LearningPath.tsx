import { cn } from "@/lib/utils";
import { CheckCircle, Lock, Circle } from "lucide-react";

interface Section {
  id: string;
  section_number: number;
  title: string;
}

interface SectionProgress {
  section_id: string;
  completed: boolean;
}

interface LearningPathProps {
  sections: Section[];
  progress: SectionProgress[];
  currentIndex: number;
  onSelect: (index: number) => void;
  tierColor?: string;
}

export const LearningPath = ({ sections, progress, currentIndex, onSelect, tierColor = "primary" }: LearningPathProps) => {
  const isCompleted = (sectionId: string) =>
    progress.some(p => p.section_id === sectionId && p.completed);

  return (
    <div className="flex flex-col items-center py-4 gap-0">
      {sections.map((section, index) => {
        const completed = isCompleted(section.id);
        const isCurrent = index === currentIndex;
        const isLocked = !completed && index > 0 && !isCompleted(sections[index - 1]?.id) && !isCurrent;
        // Winding offset
        const offset = index % 2 === 0 ? "-translate-x-8" : "translate-x-8";

        return (
          <div key={section.id} className="flex flex-col items-center">
            {/* Connector line */}
            {index > 0 && (
              <div className={cn(
                "w-0.5 h-8",
                completed || isCurrent ? "bg-primary" : "bg-muted"
              )} />
            )}

            {/* Node */}
            <button
              onClick={() => !isLocked && onSelect(index)}
              disabled={isLocked}
              className={cn(
                "relative flex items-center gap-3 transition-all duration-300",
                offset,
                isLocked && "opacity-40 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all shrink-0",
                completed
                  ? "bg-success border-success text-success-foreground shadow-md"
                  : isCurrent
                  ? "bg-primary border-primary text-primary-foreground shadow-lg scale-110 animate-pulse"
                  : "bg-muted border-border text-muted-foreground"
              )}>
                {completed ? (
                  <CheckCircle className="h-6 w-6" />
                ) : isLocked ? (
                  <Lock className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-bold">{section.section_number}</span>
                )}
              </div>
              <span className={cn(
                "text-sm font-medium max-w-[140px] text-left",
                isCurrent ? "text-foreground font-semibold" :
                completed ? "text-success" :
                "text-muted-foreground"
              )}>
                {section.title}
              </span>
            </button>
          </div>
        );
      })}

      {/* Quiz node at the bottom */}
      <div className="w-0.5 h-8 bg-muted" />
      <div className={cn(
        "w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all",
        sections.every(s => isCompleted(s.id))
          ? "bg-accent border-accent text-accent-foreground shadow-lg animate-pulse"
          : "bg-muted border-border text-muted-foreground opacity-40"
      )}>
        <span className="text-lg">🎯</span>
      </div>
      <span className="text-xs text-muted-foreground mt-1">Quiz</span>
    </div>
  );
};
