import { Check } from "lucide-react";
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
    // With room for one answer, tapping another simply swaps it; only a multi-choice list locks when full.
    const disabled = !isSelected && isMaxed && max !== 1;
    const isBouncing = justSelected === option.value;

    return (
      <button
        key={option.value}
        type="button"
        onClick={() => handleToggle(option.value, disabled)}
        className={`kit-option kit-option-sm ${isBouncing ? "animate-chip-select" : ""}`}
        data-selected={isSelected}
        aria-pressed={isSelected}
        disabled={disabled}
      >
        <span className="block truncate pr-4">{option.label}</span>
        {option.description && <span className="kit-option-note truncate">{option.description}</span>}
        {isSelected && <Check className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden="true" />}
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
            className="min-h-[44px] px-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
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
