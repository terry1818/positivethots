import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, BookOpen } from "lucide-react";
import { format } from "date-fns";

const badgeIcons: Record<string, string> = {
  "consent-fundamentals": "✓",
  "enm-principles": "♡",
  "boundaries-communication": "⬡",
  "safer-sex": "✚",
  "emotional-responsibility": "☀",
  "understanding-desire": "♥",
  "sexual-wellness-basics": "⊕",
  "pleasure-satisfaction": "✧",
  "common-sexual-concerns": "⚕",
  "sexual-orientation-spectrum": "🌈",
  "gender-identity-expression": "⚧",
  "relationship-orientations": "◇",
  "intersectionality-intimacy": "∞",
  "relationship-skills-foundation": "⚘",
  "navigating-conflict": "⚖",
  "jealousy-insecurity": "♦",
  "maintaining-intimacy": "❋",
  "advanced-enm-practices": "★",
  "kink-bdsm-basics": "⛓",
  "relationship-vision": "◉",
  "trauma-informed-relating": "🫂",
  "digital-consent-boundaries": "📱",
  "decolonizing-relationships": "🌍",
  "mental-health-first-aid": "🧠",
  "reproductive-autonomy": "⚕",
  "addiction-compulsivity": "🔄",
  "neurodivergence-intimacy": "🧩",
  "financial-intimacy": "💰",
  "grief-relationship-transitions": "🕊",
};

interface Reflection {
  id: string;
  response_text: string;
  created_at: string;
  module_sections: {
    title: string;
    section_number: number;
    module_id: string;
    education_modules: {
      title: string;
      slug: string;
      tier: string;
    };
  };
}

interface GroupedReflections {
  moduleTitle: string;
  moduleSlug: string;
  reflections: Reflection[];
}

const LearningJournal = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    const load = async () => {
      const { data } = await supabase
        .from("user_reflections")
        .select("id, response_text, created_at, module_sections!inner(title, section_number, module_id, education_modules!inner(title, slug, tier))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setReflections((data as unknown as Reflection[]) || []);
      setLoading(false);
    };

    load();
  }, [user, authLoading]);

  const grouped: GroupedReflections[] = [];
  const seen = new Map<string, number>();

  for (const r of reflections) {
    const moduleId = r.module_sections.module_id;
    if (!seen.has(moduleId)) {
      seen.set(moduleId, grouped.length);
      grouped.push({
        moduleTitle: r.module_sections.education_modules.title,
        moduleSlug: r.module_sections.education_modules.slug,
        reflections: [],
      });
    }
    grouped[seen.get(moduleId)!].reflections.push(r);
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">My Learning Journal</h1>
        </div>

        {reflections.length === 0 ? (
          <Card className="animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground text-sm max-w-xs">
                Your reflections will appear here. Complete a section with a reflection prompt to start your journal.
              </p>
            </CardContent>
          </Card>
        ) : (
          grouped.map((group) => (
            <div key={group.moduleSlug} className="space-y-3 animate-fade-in">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <span className="text-lg">{badgeIcons[group.moduleSlug] || "★"}</span>
                {group.moduleTitle}
              </h2>
              {group.reflections.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{r.module_sections.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(r.created_at), "MMMM d")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground italic">"{r.response_text}"</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LearningJournal;
