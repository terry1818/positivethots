import { X } from "lucide-react";
import { useState } from "react";

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
  const [justSelected, setJustSelected] = useState<string | null>(null);

  const handleToggle = (value: string, disabled: boolean) => {
    if (disabled) return;
    onToggle(value);
    if (!selected.includes(value)) {
      setJustSelected(value);
      setTimeout(() => setJustSelected(null), 300);
    }
  };

  return (
    <div className={`grid gap-2 ${columns === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
      {options.map((option, index) => {
        const isSelected = selected.includes(option.value);
        const disabled = !isSelected && isMaxed;
        const isBouncing = justSelected === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleToggle(option.value, disabled)}
            className={`relative rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 border text-left
              ${isBouncing ? "animate-chip-select" : ""}
              ${isSelected
                ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]"
                : disabled
                ? "bg-muted/50 text-muted-foreground border-border opacity-50 cursor-not-allowed"
                : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-primary/5 active:scale-95"
              }`}
            style={{ animationDelay: `${index * 0.02}s` }}
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
