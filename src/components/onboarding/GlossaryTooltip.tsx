import { useState, useRef, useEffect } from "react";
import { HelpCircle, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const GLOSSARY: Record<string, string> = {
  "ENM": "Ethical Non-Monogamy — any relationship structure where all partners agree to non-exclusive relationships.",
  "GGG": "Good, Giving, and Game — being a generous and open-minded partner.",
  "Solo Poly": "Polyamory where you don't seek a primary/nesting partner; you are your own primary.",
  "Hierarchical Poly": "Polyamory with a ranked structure — typically a primary partner and secondary partners.",
  "Relationship Anarchy": "A philosophy that rejects all assumed rules and hierarchies in relationships.",
  "FWB": "Friends With Benefits — a friendship that includes physical intimacy.",
  "BDSM": "Bondage, Discipline, Dominance, Submission, Sadism, Masochism — consensual power exchange.",
  "Kink": "Non-conventional sexual practices explored with consent and communication.",
  "Demisexual": "Experiencing sexual attraction only after forming a strong emotional bond.",
  "Pansexual": "Attraction to people regardless of gender identity or biological sex.",
  "Heteroflexible": "Primarily heterosexual but open to occasional same-sex experiences.",
  "Homoflexible": "Primarily homosexual but open to occasional opposite-sex experiences.",
  "Monogamish": "Mostly monogamous with occasional, mutually agreed-upon flexibility.",
  "Polycule": "A network of people connected through polyamorous relationships.",
  "Nesting Partner": "A partner you live with, without implying hierarchical priority.",
};

interface GlossaryTooltipProps {
  term: string;
}

export const GlossaryTooltip = ({ term }: GlossaryTooltipProps) => {
  const definition = GLOSSARY[term];
  const [showSheet, setShowSheet] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!definition) return null;

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowSheet(true)}
          className="inline-flex items-center ml-1 text-muted-foreground hover:text-primary transition-colors"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>

        {showSheet && (
          <div
            className="fixed inset-0 z-[60] flex items-end"
            onClick={() => setShowSheet(false)}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div
              ref={sheetRef}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full bg-card border-t border-border rounded-t-2xl p-5 pb-8 animate-in slide-in-from-bottom duration-200"
            >
              <button
                type="button"
                onClick={() => setShowSheet(false)}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
              <p className="font-semibold text-foreground text-base">{term}</p>
              <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed">{definition}</p>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex items-center ml-1 text-muted-foreground hover:text-primary transition-colors">
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px] text-sm">
        <p className="font-semibold">{term}</p>
        <p className="text-muted-foreground mt-1">{definition}</p>
      </TooltipContent>
    </Tooltip>
  );
};
