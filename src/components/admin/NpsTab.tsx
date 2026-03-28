import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Star, TrendingUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NpsRow {
  id: string;
  score: number;
  feedback: string | null;
  trigger_event: string;
  created_at: string;
}

export const NpsTab = () => {
  const [responses, setResponses] = useState<NpsRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("nps_responses" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setResponses((data as any[] || []) as NpsRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const avg = responses.length > 0
    ? (responses.reduce((s, r) => s + r.score, 0) / responses.length).toFixed(1)
    : "—";

  const promoters = responses.filter((r) => r.score >= 9).length;
  const passives = responses.filter((r) => r.score >= 7 && r.score <= 8).length;
  const detractors = responses.filter((r) => r.score <= 6).length;
  const npsScore = responses.length > 0
    ? Math.round(((promoters - detractors) / responses.length) * 100)
    : 0;

  const dist = Array.from({ length: 11 }, (_, i) => responses.filter((r) => r.score === i).length);
  const maxDist = Math.max(...dist, 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" /> NPS Survey
        </h3>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>Refresh</Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-primary">{npsScore}</p>
          <p className="text-xs text-muted-foreground">NPS Score</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold">{avg}</p>
          <p className="text-xs text-muted-foreground">Avg Score</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold">{responses.length}</p>
          <p className="text-xs text-muted-foreground">Responses</p>
        </Card>
      </div>

      {/* Distribution */}
      <Card className="p-3">
        <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" /> Score Distribution
        </p>
        <div className="flex items-end gap-1 h-16">
          {dist.map((count, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className={cn(
                  "w-full rounded-t transition-all",
                  i <= 6 ? "bg-destructive/60" : i <= 8 ? "bg-yellow-500/60" : "bg-primary/60"
                )}
                style={{ height: `${(count / maxDist) * 100}%`, minHeight: count > 0 ? 4 : 0 }}
              />
              <span className="text-[10px] text-muted-foreground">{i}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Detractors: {detractors}</span>
          <span>Passives: {passives}</span>
          <span>Promoters: {promoters}</span>
        </div>
      </Card>

      {/* Recent feedback */}
      <Card className="p-3">
        <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" /> Recent Feedback
        </p>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {responses.filter((r) => r.feedback).slice(0, 10).map((r) => (
            <div key={r.id} className="text-sm border rounded-lg p-2">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "text-xs font-bold px-1.5 py-0.5 rounded",
                  r.score <= 6 ? "bg-destructive/10 text-destructive" :
                  r.score <= 8 ? "bg-yellow-500/10 text-yellow-600" :
                  "bg-primary/10 text-primary"
                )}>{r.score}</span>
                <span className="text-xs text-muted-foreground">{r.trigger_event}</span>
              </div>
              <p className="text-muted-foreground">{r.feedback}</p>
            </div>
          ))}
          {responses.filter((r) => r.feedback).length === 0 && (
            <p className="text-sm text-muted-foreground">No feedback yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
};
