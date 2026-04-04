import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Bookmark, BookmarkCheck, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeyTakeawayProps {
  takeaway: string;
  sectionTitle: string;
}

export const KeyTakeaway = ({ takeaway, sectionTitle }: KeyTakeawayProps) => {
  const [saved, setSaved] = useState(false);

  return (
    <Card className={cn(
      "border-l-4 transition-all",
      saved ? "border-l-success bg-success/5" : "border-l-accent bg-accent/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-accent uppercase tracking-wide mb-1">Key Takeaway</p>
            <p className="text-sm leading-relaxed">{takeaway}</p>
          </div>
          <button
            onClick={() => setSaved(!saved)}
            className="shrink-0 p-1 rounded-md hover:bg-muted transition-colors"
          >
            {saved ? (
              <BookmarkCheck className="h-5 w-5 text-success" />
            ) : (
              <Bookmark className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
