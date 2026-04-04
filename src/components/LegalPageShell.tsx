import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

interface TocItem {
  id: string;
  title: string;
}

interface LegalPageShellProps {
  title: string;
  toc: TocItem[];
  children: React.ReactNode;
}

export const LegalPageShell = ({ title, toc, children }: LegalPageShellProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back" className="shrink-0 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Logo size="sm" showText={false} />
          <h1 className="font-semibold text-base truncate">{title}</h1>
        </div>
      </div>

      {toc.length > 0 && (
        <nav className="border-b border-border bg-card" aria-label="Table of contents">
          <div className="container max-w-2xl mx-auto px-4 py-3">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Jump to section</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {toc.map(s => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="text-sm text-primary hover:underline py-0.5"
                >
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        </nav>
      )}

      <main className="flex-1 container max-w-2xl mx-auto px-4 py-6">
        <div className="prose prose-sm max-w-none text-foreground">
          {children}
        </div>
      </main>
    </div>
  );
};
