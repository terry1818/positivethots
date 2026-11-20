import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ExerciseSession } from "@/components/education/ExerciseSession";
import { BrandedEmptyState } from "@/components/BrandedEmptyState";
import { PageSkeleton } from "@/components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/errorReporting";
import { reviewSourceId } from "@/lib/learnLevels";
import type { XPAwardResult } from "@/lib/xpAward";
import type { QuizResult } from "@/lib/quizAnswers";
import { ChevronLeft } from "lucide-react";

export default function TierReview() {
  const { tier = "" } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<React.ComponentProps<typeof ExerciseSession>["questions"]>([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [locked, setLocked] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [awarded, setAwarded] = useState<number | null>(null);
  const [finished, setFinished] = useState<QuizResult | null>(null);
  const load = async () => {
    setLoading(true); setError(false); setResult(null); setFinished(null); setAwarded(null); setQuestions([]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);
      const { data: modules, error: me } = await supabase.from("education_modules").select("id").eq("tier", tier);
      if (me) throw me;
      const { data: badges, error: be } = await supabase.from("user_badges").select("module_id").eq("user_id", session.user.id);
      if (be) throw be;
      const ids = new Set(modules?.map(m => m.id));
      const badgeCount = badges?.filter(b => ids.has(b.module_id)).length || 0;
      setLocked(badgeCount < 2);
      if (badgeCount >= 2) {
        const { data, error: qe } = await supabase.rpc("get_review_questions", { _tier: tier, _limit: 8 });
        if (qe) throw qe;
        setQuestions((data || []).map(q => ({ ...q, options: (typeof q.options === "string" ? JSON.parse(q.options) : q.options) as string[], exercise_type: q.exercise_type || "multiple_choice" })));
      }
    } catch (e) { setError(true); void reportError(e instanceof Error ? e : new Error("Review loading failed")); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [tier]);
  const finish = async (summary: QuizResult) => {
    if (saving || result) return;
    setFinished(summary); setSaving(true); setSaveError(false);
    try {
      const { data, error } = await supabase.rpc("award_xp", { _user_id: userId, _amount: 30, _source: "tier_review", _source_id: reviewSourceId(tier) });
      if (error) throw error;
      setAwarded((data as unknown as XPAwardResult).awarded); setResult(summary);
    } catch (e) { setSaveError(true); void reportError(e instanceof Error ? e : new Error("Review reward failed")); }
    finally { setSaving(false); }
  };
  if (loading) return <PageSkeleton variant="learn" />;
  const back = () => navigate("/learn");
  if (error || locked || !questions.length) return <BrandedEmptyState mascot="graduate" description="" headline={error ? "We couldn't load your path." : locked ? "Earn 2 badges in this tier to unlock" : "Nothing to review yet. Earn a badge first."} ctaLabel={error ? "Try again" : "Back to my path"} onCtaClick={error ? () => void load() : back} />;
  return <main className="mx-auto min-h-screen max-w-[480px] space-y-4 bg-background px-4 py-4">
    <Button variant="ghost" size="icon" aria-label="Back to my path" onClick={back}><ChevronLeft /></Button>
    <h1 className="text-xl font-bold">{tier.replace(/_/g, " ")} Review</h1>
    {awarded !== null && <p aria-live="polite">{awarded > 0 ? `+${awarded} XP` : "Come back tomorrow for more XP."}</p>}
    <ExerciseSession moduleId={tier} moduleTitle="Tier Review" userId={userId} questions={questions}
      preserveQuestionOrder finalResult={result} submitting={saving} submissionError={saveError}
      onRetrySubmit={() => { if (finished) void finish(finished); }} onBack={back}
      onComplete={(score, correct, total) => void finish({ score, correct, total, passed: score >= 80 })} />
  </main>;
}