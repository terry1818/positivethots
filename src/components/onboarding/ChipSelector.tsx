import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ChipOption {
  value: string;
  label: string;
  description?: string;
}

interface ChipSelectorProps {
  options: ChipOption[];
  selected: string[];
  onToggle: (value: string) => void;
  max?: number;
  columns?: 2 | 3;
}

export const ChipSelector = ({ options, selected, onToggle, max, columns = 3 }: ChipSelectorProps) => {
  const isMaxed = max ? selected.length >= max : false;

  return (
    <div className={`grid gap-2 ${columns === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        const disabled = !isSelected && isMaxed;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => !disabled && onToggle(option.value)}
            className={`relative rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 border text-left
              ${isSelected
                ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]"
                : disabled
                ? "bg-muted/50 text-muted-foreground border-border opacity-50 cursor-not-allowed"
                : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-primary/5 active:scale-95"
              }`}
          >
            <span className="block truncate">{option.label}</span>
            {option.description && (
              <span className={`block text-xs mt-0.5 truncate ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {option.description}
              </span>
            )}
            {isSelected && (
              <X className="absolute top-1.5 right-1.5 h-3 w-3" />
            )}
          </button>
        );
      })}
    </div>
  );
};
