import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, AlertTriangle, XCircle, Crown, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CourseHealth {
  id: string;
  slug: string;
  title: string;
  tier: string | null;
  section_count: number;
  quiz_count: number;
  min_section_chars: number;
}

type Status = "ok" | "needs_fix" | "missing";

const getStatus = (c: CourseHealth): Status => {
  if (c.section_count === 4 && c.quiz_count === 7 && c.min_section_chars >= 2800) return "ok";
  return "needs_fix";
};

const TIER_ORDER: Record<string, number> = {
  foundation: 1, sexual_health: 2, identity_diversity: 3, healthy_relationships: 4, advanced: 5,
};

const TIER_LABELS: Record<string, string> = {
  foundation: "Foundation", sexual_health: "Sexual Health", identity_diversity: "Identity & Diversity",
  healthy_relationships: "Healthy Relationships", advanced: "Advanced",
};

const ALL_TIERS = ["all", "foundation", "sexual_health", "identity_diversity", "healthy_relationships", "advanced"] as const;
const STATUS_FILTERS = ["all", "ok", "needs_fix"] as const;

export const EducationConsistencyDashboard = () => {
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: courses = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-education-health"],
    queryFn: async () => {
      // Fetch modules
      const { data: modules, error: mErr } = await supabase
        .from("education_modules")
        .select("id, slug, title, tier")
        .order("order_index");
      if (mErr) throw mErr;

      // Fetch section stats
      const { data: sectionStats } = await supabase
        .from("module_sections")
        .select("module_id, id, content_text");

      // Fetch quiz counts
      const { data: quizRows } = await supabase
        .from("quiz_questions")
        .select("module_id, id");

      // Aggregate
      const sectionMap = new Map<string, { count: number; minChars: number }>();
      for (const s of sectionStats || []) {
        const existing = sectionMap.get(s.module_id) || { count: 0, minChars: Infinity };
        existing.count++;
        const len = s.content_text?.length || 0;
        if (len < existing.minChars) existing.minChars = len;
        sectionMap.set(s.module_id, existing);
      }

      const quizMap = new Map<string, number>();
      for (const q of quizRows || []) {
        quizMap.set(q.module_id, (quizMap.get(q.module_id) || 0) + 1);
      }

      return (modules || []).map((m): CourseHealth => {
        const sec = sectionMap.get(m.id) || { count: 0, minChars: 0 };
        return {
          id: m.id,
          slug: m.slug,
          title: m.title,
          tier: m.tier,
          section_count: sec.count,
          quiz_count: quizMap.get(m.id) || 0,
          min_section_chars: sec.count > 0 ? sec.minChars : 0,
        };
      }).sort((a, b) => (TIER_ORDER[a.tier || ""] || 6) - (TIER_ORDER[b.tier || ""] || 6));
    },
    staleTime: 30_000,
  });

  const filtered = courses.filter(c => {
    if (tierFilter !== "all" && c.tier !== tierFilter) return false;
    if (statusFilter !== "all" && getStatus(c) !== statusFilter) return false;
    return true;
  });

  const okCount = courses.filter(c => getStatus(c) === "ok").length;
  const fixCount = courses.filter(c => getStatus(c) === "needs_fix").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="bg-[hsl(var(--card))] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 border border-white/10">
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-green-400">
            <CheckCircle className="h-4 w-4" /> {okCount} OK
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <AlertTriangle className="h-4 w-4" /> {fixCount} Needs Fix
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}
          className="text-muted-foreground hover:text-foreground min-h-[44px]">
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-1.5">Refresh</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {ALL_TIERS.map(t => (
          <button key={t} onClick={() => setTierFilter(t)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[44px]",
              tierFilter === t
                ? "bg-primary text-primary-foreground"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            )}>
            {t === "all" ? "All Tiers" : TIER_LABELS[t] || t}
          </button>
        ))}
        <div className="w-px bg-white/10 mx-1" />
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[44px]",
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            )}>
            {s === "all" ? "All Statuses" : s === "ok" ? "✅ OK Only" : "⚠️ Needs Fix"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[hsl(var(--card))] rounded-xl border border-white/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[hsl(var(--background))]">
              <th className="text-left p-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Course</th>
              <th className="text-left p-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Tier</th>
              <th className="text-center p-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Sections</th>
              <th className="text-center p-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Quiz Qs</th>
              <th className="text-center p-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Min Chars</th>
              <th className="text-center p-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No courses match filters.</td></tr>
            ) : filtered.map(c => {
              const status = getStatus(c);
              return (
                <tr key={c.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-3 text-foreground/80 max-w-[200px]">
                    <span className="truncate block">{c.title}</span>
                  </td>
                  <td className="p-3">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                      {TIER_LABELS[c.tier || ""] || c.tier || "—"}
                    </span>
                  </td>
                  <td className={cn("p-3 text-center", c.section_count !== 4 && "text-amber-400 font-bold")}>
                    {c.section_count}
                  </td>
                  <td className={cn("p-3 text-center", c.quiz_count !== 7 && "text-amber-400 font-bold")}>
                    {c.quiz_count}
                  </td>
                  <td className={cn("p-3 text-center", c.min_section_chars < 2800 && "text-amber-400 font-bold")}>
                    {c.min_section_chars.toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    {status === "ok" ? (
                      <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full text-xs font-medium">
                        <CheckCircle className="h-3 w-3" /> OK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full text-xs font-medium">
                        <AlertTriangle className="h-3 w-3" /> Fix
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
