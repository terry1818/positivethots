import { cn } from "@/lib/utils";
import { CheckCircle, Lock, Crown } from "lucide-react";

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

export const LearningPath = ({ sections, progress, currentIndex, onSelect }: LearningPathProps) => {
  const isCompleted = (sectionId: string) =>
    progress.some(p => p.section_id === sectionId && p.completed);

  const allComplete = sections.every(s => isCompleted(s.id));

  return (
    <div className="mb-6">
      {/* Horizontal scrollable lesson bar */}
      <div className="flex gap-3 overflow-x-auto pb-3 px-1 scrollbar-hide">
        {sections.map((section, index) => {
          const completed = isCompleted(section.id);
          const isCurrent = index === currentIndex;
          const isLocked = !completed && index > 0 && !isCompleted(sections[index - 1]?.id) && !isCurrent;

          return (
            <button
              key={section.id}
              onClick={() => !isLocked && onSelect(index)}
              disabled={isLocked}
              className={cn(
                "relative flex flex-col items-center gap-1.5 min-w-[64px] transition-all duration-300",
                isLocked && "opacity-40 cursor-not-allowed"
              )}
            >
              {/* Node circle */}
              <div className="relative">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all shrink-0",
                  completed
                    ? "bg-success border-success text-success-foreground shadow-md"
                    : isCurrent
                    ? "bg-primary border-primary text-primary-foreground shadow-lg scale-110"
                    : "bg-muted border-border text-muted-foreground"
                )}>
                  {completed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : isLocked ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-bold">{section.section_number}</span>
                  )}
                </div>
                
                {/* Current indicator pulse */}
                {isCurrent && !completed && (
                  <div className="absolute inset-0 rounded-full border-2 border-primary animate-ripple-complete" />
                )}

                {/* Completion ripple */}
                {completed && (
                  <div className="absolute -inset-1 rounded-full bg-success/20 animate-pulse" style={{ animationDuration: "3s" }} />
                )}
              </div>

              {/* Title */}
              <span className={cn(
                "text-[10px] leading-tight text-center max-w-[64px] line-clamp-2",
                isCurrent ? "text-foreground font-semibold" :
                completed ? "text-success" :
                "text-muted-foreground"
              )}>
                {section.title}
              </span>

              {/* Estimated time */}
              <span className="text-[9px] text-muted-foreground">~3 min</span>
            </button>
          );
        })}

        {/* Quiz node */}
        <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all",
            allComplete
              ? "bg-accent border-accent text-accent-foreground shadow-lg animate-pulse"
              : "bg-muted border-border text-muted-foreground opacity-40"
          )}>
            {allComplete ? (
              <Crown className="h-5 w-5 animate-crown-spin" />
            ) : (
              <span className="text-lg">🎯</span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">Quiz</span>
        </div>
      </div>

      {/* Connector line */}
      <div className="h-0.5 bg-gradient-to-r from-success via-primary to-muted rounded-full -mt-1 mx-4 opacity-30" />
    </div>
  );
};
