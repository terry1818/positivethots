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
  popularOptions?: string[];
  groupPopularFirst?: boolean;
}

export const ChipSelector = ({ options, selected, onToggle, max, columns = 3, popularOptions, groupPopularFirst }: ChipSelectorProps) => {
  const isMaxed = max ? selected.length >= max : false;
  const [justSelected, setJustSelected] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const handleToggle = (value: string, disabled: boolean) => {
    if (disabled) return;
    onToggle(value);
    if (!selected.includes(value)) {
      setJustSelected(value);
      setTimeout(() => setJustSelected(null), 300);
    }
  };

  const popularSet = new Set(popularOptions?.map(p => p.toLowerCase()) || []);

  const renderChip = (option: ChipOption, index: number) => {
    const isSelected = selected.includes(option.value);
    const disabled = !isSelected && isMaxed;
    const isBouncing = justSelected === option.value;
    const isPopular = popularSet.has(option.value.toLowerCase()) || popularSet.has(option.label.toLowerCase());

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
          <span className={`block text-sm mt-0.5 truncate ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
            {option.description}
          </span>
        )}
        {isPopular && !isSelected && (
          <span className="absolute top-1 right-1.5 text-sm text-primary/60 font-medium">Popular</span>
        )}
        {isSelected && (
          <X className="absolute top-1.5 right-1.5 h-3 w-3" />
        )}
      </button>
    );
  };

  // Group popular first mode (for interests step)
  if (groupPopularFirst && popularOptions && popularOptions.length > 0) {
    const popularItems = options.filter(o => popularSet.has(o.value.toLowerCase()) || popularSet.has(o.label.toLowerCase()));
    const otherItems = options.filter(o => !popularSet.has(o.value.toLowerCase()) && !popularSet.has(o.label.toLowerCase()));

    return (
      <div className="space-y-3">
        <div className={`grid gap-2 ${columns === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
          {popularItems.map((option, index) => renderChip(option, index))}
        </div>
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-border" />
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAll ? "Show less" : `More options (${otherItems.length})`}
          </button>
          <div className="flex-1 h-px bg-border" />
        </div>
        {showAll && (
          <div className={`grid gap-2 ${columns === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
            {otherItems.map((option, index) => renderChip(option, popularItems.length + index))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`grid gap-2 ${columns === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
      {options.map((option, index) => renderChip(option, index))}
    </div>
  );
};
