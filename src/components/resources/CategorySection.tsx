import { useState } from "react";
import { BookOpen, Heart, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { ResourceCard, type Resource } from "./ResourceCard";

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  books: {
    label: "Books & Education",
    icon: <BookOpen className="w-5 h-5" />,
    description: "Essential reads on ethical non-monogamy, communication, and attachment styles.",
  },
  connection: {
    label: "Intimacy & Connection",
    icon: <Heart className="w-5 h-5" />,
    description: "Conversation starters, date night games, and tools for meaningful bonding.",
  },
  selfcare: {
    label: "Self-Care & Wellness",
    icon: <Sparkles className="w-5 h-5" />,
    description: "Show up as your best self in all your relationships.",
  },
};

const INITIAL_SHOW = 6;

export const CategorySection = ({
  category,
  resources,
  showHeader = true,
}: {
  category: string;
  resources: Resource[];
  showHeader?: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[category];
  const hasMore = resources.length > INITIAL_SHOW;
  const visible = expanded ? resources : resources.slice(0, INITIAL_SHOW);

  return (
    <section className="mb-10">
      {showHeader && meta && (
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">{meta.icon}</div>
            <h2 className="text-lg font-semibold text-white">{meta.label}</h2>
            <span className="text-sm text-gray-500">({resources.length})</span>
          </div>
          <p className="text-sm text-gray-500 ml-12">{meta.description}</p>
        </div>
      )}

      {!showHeader && meta && (
        <p className="text-sm text-gray-500 mb-4">{meta.description}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {visible.map((r) => (
          <ResourceCard key={r.id} resource={r} />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center gap-1 mx-auto transition-colors"
        >
          {expanded ? (
            <>Show Less <ChevronUp className="w-4 h-4" /></>
          ) : (
            <>Show More ({resources.length - INITIAL_SHOW} more) <ChevronDown className="w-4 h-4" /></>
          )}
        </button>
      )}
    </section>
  );
};
