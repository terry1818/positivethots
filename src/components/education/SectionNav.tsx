import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

interface Section {
  id: string;
  section_number: number;
  title: string;
}

interface SectionProgress {
  section_id: string;
  completed: boolean;
}

interface SectionNavProps {
  sections: Section[];
  progress: SectionProgress[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

export const SectionNav = ({ sections, progress, currentIndex, onSelect }: SectionNavProps) => {
  const isCompleted = (sectionId: string) =>
    progress.some(p => p.section_id === sectionId && p.completed);

  return (
    <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
      {sections.map((section, index) => (
        <button
          key={section.id}
          onClick={() => onSelect(index)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all min-w-0 shrink-0",
            index === currentIndex
              ? "bg-primary text-primary-foreground"
              : isCompleted(section.id)
              ? "bg-success/10 text-success hover:bg-success/20"
              : "bg-muted/80 text-muted-foreground hover:bg-muted border border-border"
          )}
        >
          {isCompleted(section.id) && <CheckCircle className="h-3 w-3 shrink-0" />}
          <span className="truncate">{section.section_number}</span>
        </button>
      ))}
    </div>
  );
};
