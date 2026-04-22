import { Sparkles } from "lucide-react";
import { ResourceCard, type Resource } from "./ResourceCard";

export const FeaturedSpotlight = ({ resources }: { resources: Resource[] }) => {
  if (resources.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">Positive Thots<sup className="text-[0.5em] ml-0.5 align-super">TM</sup> Picks</h2>
        </div>
        <p className="text-sm text-gray-500">Our top recommendations to start your journey</p>
      </div>

      <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide">
        {resources.map((r) => (
          <div key={r.id} className="min-w-[280px] max-w-[320px] snap-start flex-shrink-0">
            <ResourceCard resource={r} featured />
          </div>
        ))}
      </div>
    </section>
  );
};
