import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface HeightSliderProps {
  value: number | null;
  onChange: (cm: number | null) => void;
}

const cmToFeetInches = (cm: number) => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
};

export const HeightSlider = ({ value, onChange }: HeightSliderProps) => {
  const [unit, setUnit] = useState<"cm" | "ft">("ft");
  const current = value ?? 170;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Unit</span>
        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          <Button
            type="button"
            size="sm"
            variant={unit === "ft" ? "default" : "ghost"}
            className="h-7 px-3 text-xs"
            onClick={() => setUnit("ft")}
          >
            ft/in
          </Button>
          <Button
            type="button"
            size="sm"
            variant={unit === "cm" ? "default" : "ghost"}
            className="h-7 px-3 text-xs"
            onClick={() => setUnit("cm")}
          >
            cm
          </Button>
        </div>
      </div>

      <div className="text-center">
        <span className="text-5xl font-bold text-foreground">
          {unit === "ft" ? cmToFeetInches(current) : `${current} cm`}
        </span>
      </div>

      <Slider
        value={[current]}
        onValueChange={([v]) => onChange(v)}
        min={120}
        max={220}
        step={1}
        className="py-4"
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{unit === "ft" ? cmToFeetInches(120) : "120 cm"}</span>
        <span>{unit === "ft" ? cmToFeetInches(220) : "220 cm"}</span>
      </div>
    </div>
  );
};
