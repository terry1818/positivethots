import { useEffect, useState } from "react";
import { X } from "lucide-react";
import glossary from "@/content/glossary.json";
import { useSoundEffects } from "@/hooks/useSoundEffects";

const meanings: Record<string, string> = glossary;

/**
 * Plain-English meanings for jargon in lesson text. Words marked by the lesson renderer
 * (class "glossary-term") open this small sheet on tap, Enter or Space; Escape or the button closes it.
 * Mount one wherever lesson text is rendered, or the underlined words do nothing.
 */
export function GlossarySheet({ floating = false }: { /** Stick to the bottom of a scrolling page instead of sitting above a fixed footer. */ floating?: boolean }) {
  const [open, setOpen] = useState<{ word: string; meaning: string } | null>(null);
  const { playCardOpen } = useSoundEffects();
  useEffect(() => {
    const show = (target: EventTarget | null) => {
      const el = target instanceof Element ? target.closest<HTMLElement>(".glossary-term") : null;
      const meaning = el?.dataset.term ? meanings[el.dataset.term] : undefined;
      if (!el || !meaning) return false;
      playCardOpen(); setOpen({ word: el.textContent || el.dataset.term || "", meaning });
      return true;
    };
    const click = (event: MouseEvent) => { show(event.target); };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
      else if ((event.key === "Enter" || event.key === " ") && show(event.target)) { event.preventDefault(); event.stopPropagation(); }
    };
    document.addEventListener("click", click); document.addEventListener("keydown", key, true);
    return () => { document.removeEventListener("click", click); document.removeEventListener("keydown", key, true); };
  }, [playCardOpen]);
  if (!open) return <div aria-live="polite" className="sr-only" />;
  return <div className={floating ? "glossary-sheet glossary-sheet-floating" : "glossary-sheet"} role="dialog" aria-label={`What ${open.word} means`} aria-live="polite">
    <div className="glossary-sheet-body"><p className="glossary-sheet-word">{open.word}</p><p>{open.meaning}</p></div>
    <button type="button" className="glossary-sheet-close" aria-label="Close" onClick={() => setOpen(null)}><X aria-hidden="true" /></button>
  </div>;
}
