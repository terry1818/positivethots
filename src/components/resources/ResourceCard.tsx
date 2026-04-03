import { useEffect, useState } from "react";
import { ExternalLink, BookOpen, Heart, Sparkles, Star, Megaphone } from "lucide-react";
import { BlurImage } from "@/components/BlurImage";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  category: string;
  url: string;
  image_url: string | null;
  is_featured: boolean;
  order_index: number;
  author?: string;
  price?: string;
  rating?: number;
  tag?: string;
}

const categoryIcon = (category: string) => {
  switch (category) {
    case "books": return <BookOpen className="w-12 h-12 text-muted-foreground/40" />;
    case "connection": return <Heart className="w-12 h-12 text-muted-foreground/40" />;
    case "selfcare": return <Sparkles className="w-12 h-12 text-muted-foreground/40" />;
    case "advocacy": return <Megaphone className="w-12 h-12 text-muted-foreground/40" />;
    default: return <BookOpen className="w-12 h-12 text-muted-foreground/40" />;
  }
};

const StarRating = ({ rating }: { rating: number }) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < full
              ? "fill-yellow-400 text-yellow-400"
              : i === full && half
              ? "fill-yellow-400/50 text-yellow-400"
              : "text-muted-foreground/20"
          }`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating}</span>
    </div>
  );
};

const categoryLabel: Record<string, string> = {
  books: "Books",
  connection: "Connection",
  selfcare: "Self-Care",
};

export const ResourceCard = ({ resource, featured = false }: { resource: Resource; featured?: boolean }) => {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [resource.image_url]);

  const fallbackLetter = resource.title?.[0]?.toUpperCase() || "?";


  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={`group relative flex flex-col h-full rounded-xl overflow-hidden transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/40 ${
        featured
          ? "border border-purple-500/30 bg-gradient-to-br from-gray-900 via-gray-900 to-purple-950/30"
          : "bg-gray-900/60 border border-gray-800/50"
      }`}
    >
      <ExternalLink className="absolute top-3 right-3 w-4 h-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity z-10" />

      {featured && (
        <span className="absolute top-3 left-3 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-medium z-10">
          Recommended
        </span>
      )}

      <div className="h-48 w-full bg-white/5 flex items-center justify-center p-4">
        {resource.image_url && !imageFailed ? (
          <BlurImage
            src={resource.image_url}
            alt={resource.title}
            className="h-full w-full"
            imgClassName="object-contain"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg w-full h-full">
            <span className="text-4xl font-bold text-white">{fallbackLetter}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-base font-semibold text-white line-clamp-2 leading-snug">
          {resource.title}
        </h3>

        {resource.author && (
          <p className="text-xs text-muted-foreground mt-1">{resource.author}</p>
        )}

        {resource.description && (
          <p className="text-sm text-gray-400 line-clamp-2 mt-1">{resource.description}</p>
        )}

        <div className="flex-1" />

        <div className="flex items-center justify-between mt-auto pt-3">
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full">
              {resource.tag || categoryLabel[resource.category] || resource.category}
            </span>
            {resource.price && (
              <span className="text-xs font-medium text-purple-400">{resource.price}</span>
            )}
          </div>
          {resource.rating && resource.rating > 0 && (
            <StarRating rating={resource.rating} />
          )}
        </div>

        <p className="text-[10px] text-gray-600 text-right mt-2">Affiliate link</p>
      </div>
    </a>
  );
};

export type { Resource };
