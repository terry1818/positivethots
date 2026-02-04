import { Heart } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const Logo = ({ size = "md", showText = true }: LogoProps) => {
  const iconSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };
  
  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl"
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Heart className={`${iconSizes[size]} text-primary fill-primary`} />
        <Heart className={`${iconSizes[size]} text-secondary fill-secondary absolute top-0 left-1 opacity-60`} />
      </div>
      {showText && (
        <span className={`${textSizes[size]} font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent`}>
          Positive Thots
        </span>
      )}
    </div>
  );
};