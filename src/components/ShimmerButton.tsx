import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ShimmerButton = ({ className, children, ...props }: ButtonProps) => {
  return (
    <Button
      className={cn(
        "relative overflow-hidden",
        "after:absolute after:inset-0 after:translate-x-[-100%] after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:animate-shimmer-sweep",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};
