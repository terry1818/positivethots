import { useState, ImgHTMLAttributes } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlurImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "onLoad" | "onError"> {
  aspectRatio?: string;
  fallbackClassName?: string;
  onError?: () => void;
}

export const BlurImage = ({
  src,
  alt,
  className,
  aspectRatio,
  fallbackClassName,
  style,
  onError: onErrorProp,
  ...props
}: BlurImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      className={cn("relative overflow-hidden bg-primary/10", className)}
      style={{ aspectRatio, ...style }}
    >
      {/* Shimmer placeholder */}
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10" />
      )}

      {error ? (
        <div className={cn("absolute inset-0 flex items-center justify-center bg-primary/10", fallbackClassName)}>
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-6 w-6 text-primary/40" />
          </div>
        </div>
      ) : (
        <img
          src={src}
          alt={alt || ""}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
          style={{ opacity: loaded ? 1 : 0 }}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          draggable={false}
          {...props}
        />
      )}
    </div>
  );
};
