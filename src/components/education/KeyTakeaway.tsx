import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bookmark, BookmarkCheck, Lightbulb } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { reportError } from "@/lib/errorReporting";
import { cn } from "@/lib/utils";

interface KeyTakeawayProps {
  takeaway: string;
  sectionTitle: string;
  sectionId?: string;
}

export const KeyTakeaway = ({ takeaway, sectionTitle, sectionId }: KeyTakeawayProps) => {
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const { user } = useAuth();
  useEffect(() => {
    if (!user || !sectionId) return;
    let active = true;
    void supabase.from("user_saved_takeaways").select("id").eq("user_id", user.id).eq("section_id", sectionId).maybeSingle().then(({ data, error }) => { if (active && !error) setSaved(!!data); });
    return () => { active = false; };
  }, [user?.id, sectionId]);
  const toggle = async () => {
    if (!user || !sectionId || pending) return;
    const before = saved; setSaved(!before); setPending(true);
    const { error } = before ? await supabase.from("user_saved_takeaways").delete().eq("user_id", user.id).eq("section_id", sectionId) : await supabase.from("user_saved_takeaways").insert({ user_id: user.id, section_id: sectionId, takeaway_text: takeaway });
    if (error) { setSaved(before); toast.error("Couldn't save that. Try again."); void reportError(new Error(error.message)); }
    setPending(false);
  };

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
          <Button variant="ghost" size="icon" aria-label={saved ? "Remove saved takeaway" : "Save takeaway"}
            onClick={() => void toggle()} disabled={pending || !sectionId || !user} aria-pressed={saved}
            className="shrink-0 min-h-11 min-w-11"
          >
            {saved ? (
              <BookmarkCheck className="h-5 w-5 text-success" />
            ) : (
              <Bookmark className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
