import { cn } from "@/lib/utils";

interface BrandTaglineProps {
  variant?: "primary" | "secondary" | "muted";
  text?: string;
  className?: string;
  withPeriod?: boolean;
}

const variantStyles = {
  primary: "text-primary text-base",
  secondary: "text-[rgba(255,255,255,0.7)] text-sm",
  muted: "text-[rgba(255,255,255,0.5)] text-xs",
} as const;

export const BrandTagline = ({
  variant = "primary",
  text = "Think Positive Thots",
  className,
  withPeriod = true,
}: BrandTaglineProps) => {
  return (
    <p
      className={cn(
        "font-normal not-italic leading-relaxed",
        variantStyles[variant],
        className
      )}
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {text}{withPeriod ? "." : ""}
      <sup className="opacity-70" style={{ fontSize: "60%", verticalAlign: "super" }}>
        TM
      </sup>
    </p>
  );
};
