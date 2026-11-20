import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { m } from "motion/react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageSkeleton } from "@/components/PageSkeleton";
import { BrandedEmptyState } from "@/components/BrandedEmptyState";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BottomNav } from "@/components/BottomNav";
import { PressScale } from "@/components/motion/PressScale";
import { LearnHeader } from "@/components/education/LearnHeader";
import { LearnTabs } from "@/components/education/LearnTabs";
import { PathIcon, type PathIconKind } from "@/components/education/pathIcons";
import { Mascot } from "@/components/mascot/Mascot";
import { useLearningStats } from "@/hooks/useLearningStats";
import { useTotalBadgeCount } from "@/hooks/useTotalBadgeCount";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { extractTakeaway } from "@/lib/learnSmallFixes";
import { flashRewardEligible, practiceSessionKey, practiceUnlocked, type PracticeMode } from "@/lib/practiceHub";
import { reportError } from "@/lib/errorReporting";
import type { FinishData } from "@/lib/learnFinish";
import type { MistakeQuestion } from "@/components/education/practice/MistakesPractice";
import type { RapidQuestion } from "@/components/education/exercises/RapidFireExercise";
import type { FlashIdea } from "@/components/education/practice/FlashPractice";
import type { MatchSet } from "@/components/education/practice/QuickMatchPractice";
const Mistakes = lazy(() => import("@/components/education/practice/MistakesPractice"));
const Rapid = lazy(() => import("@/components/education/exercises/RapidFireExercise"));
const Flash = lazy(() => import("@/components/education/practice/FlashPractice"));
const Match = lazy(() => import("@/components/education/practice/QuickMatchPractice"));
const Finish = lazy(() => import("@/components/education/FinishSequence"));
export default function PracticeHub() {
  const { user, loading: authLoading } = useAuth(); const navigate = useNavigate(); const { stats, reload: refreshStats } = useLearningStats(); const { total } = useTotalBadgeCount();
  const [loading, setLoading] = useState(true); const [error, setError] = useState(false); const [badges, setBadges] = useState(0); const [mistakes, setMistakes] = useState(0); const [hasMatch, setHasMatch] = useState(false); const [earned, setEarned] = useState(0);
  const [timerOff, setTimerOff] = useState(false); const [savedOnly, setSavedOnly] = useState(false); const [mode, setMode] = useState<PracticeMode | null>(null); const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<MistakeQuestion[]>([]); const [rapid, setRapid] = useState<RapidQuestion[]>([]); const [cards, setCards] = useState<FlashIdea[]>([]); const [sets, setSets] = useState<MatchSet[]>([]);
  const [finish, setFinish] = useState<FinishData | null>(null); const [rewardError, setRewardError] = useState(false); const [cap, setCap] = useState(false); const key = useRef(""); const saving = useRef(false); const summary = useRef<{ accuracy: number; total: number } | null>(null);
  const reduced = useReducedMotion(); const { playNodeTap, playNodeComplete } = useSoundEffects();
  const load = async () => { if (!user) return; setLoading(true); setError(false); try {
    const day = `${new Date().toISOString().slice(0, 10)}T00:00:00Z`;
    const [b, m, match, xp, pref] = await Promise.all([supabase.from("user_badges").select("id", { count: "exact", head: true }).eq("user_id", user.id), supabase.rpc("get_mistake_count"), supabase.rpc("has_match_content"), supabase.from("xp_transactions").select("xp_amount").eq("user_id", user.id).eq("source", "practice_tab").gte("created_at", day), supabase.from("user_preferences").select("value").eq("user_id", user.id).eq("key", "practice_timer").maybeSingle()]);
    for (const result of [b, m, match, xp, pref]) if (result.error) throw result.error;
    setBadges(b.count || 0); setMistakes(Number(m.data || 0)); setHasMatch(match.data === true); setEarned((xp.data || []).reduce((sum, r) => sum + r.xp_amount, 0)); setTimerOff(pref.data?.value === "off");
  } catch (e) { setError(true); void reportError(e instanceof Error ? e : new Error("Practice load failed")); } finally { setLoading(false); } };
  useEffect(() => { if (!authLoading && !user) navigate("/auth"); if (user) void load(); }, [user?.id, authLoading]);
  const timer = async (off: boolean) => { if (!user) return; const before = timerOff; setTimerOff(off); const { error } = await supabase.from("user_preferences").upsert({ user_id: user.id, key: "practice_timer", value: off ? "off" : "on", updated_at: new Date().toISOString() }, { onConflict: "user_id,key" }); if (error) { setTimerOff(before); void reportError(new Error(error.message)); } };
  const enter = async (selected: PracticeMode, onlySaved = savedOnly) => { if (!user) return; playNodeTap(); setMode(selected); setStarted(false); setLoading(true); setError(false); key.current = practiceSessionKey(selected); summary.current = null;
    try {
      if (selected === "mistakes") { const { data, error } = await supabase.rpc("get_mistake_questions", { _limit: 10 }); if (error) throw error; setQuestions((data || []).map(q => ({ id: q.id, question: q.question, options: q.options as string[] }))); }
      if (selected === "rapid") { const { data, error } = await supabase.rpc("get_rapid_fire_items", { _limit: 10 }); if (error) throw error; setRapid(data || []); }
      if (selected === "match") { const { data, error } = await supabase.rpc("get_match_sets", { _limit: 1 }); if (error) throw error; setSets((data || []).map(q => ({ ...q, left_items: q.left_items as string[], right_items: q.right_items as string[] }))); }
      if (selected === "flash") {
        if (onlySaved) { const { data, error } = await supabase.from("user_saved_takeaways").select("section_id,takeaway_text,module_sections(title)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10); if (error) throw error; setCards((data || []).map(r => ({ id: r.section_id, title: r.module_sections?.title || "Key idea", takeaway: r.takeaway_text }))); }
        else { const { data, error } = await supabase.from("user_section_progress").select("section_id,module_sections(title,content_text)").eq("user_id", user.id).eq("completed", true).order("last_accessed", { ascending: false }).limit(10); if (error) throw error; setCards((data || []).map(r => ({ id: r.section_id, title: r.module_sections?.title || "Key idea", takeaway: extractTakeaway(r.module_sections?.content_text || "") })).filter(c => c.takeaway)); }
      }
      setStarted(selected !== "flash");
    } catch (e) { setError(true); void reportError(e instanceof Error ? e : new Error("Practice session unavailable")); } finally { setLoading(false); }
  };
  const back = () => { setMode(null); setStarted(false); setFinish(null); setRewardError(false); setCap(false); void load(); void refreshStats(); };
  const complete = async (accuracy: number, count: number) => {
    if (!mode || saving.current) return; saving.current = true; summary.current = { accuracy, total: count }; setRewardError(false);
    try { let awarded = 0; if (mode !== "flash" || flashRewardEligible(cards.length)) { const { data, error } = await supabase.rpc("award_practice_xp", { _mode: mode, _session_key: key.current }); if (error) {
        if (!error.message.includes("already rewarded")) throw error;
        const receipt = await supabase.from("xp_transactions").select("xp_amount").eq("source", "practice_tab").eq("source_id", key.current).maybeSingle();
        if (receipt.error || !receipt.data) throw error;
        setFinish({ kind: "practice", moduleId: "", node: "practice_tab", title: "Practice", slug: "", tier: "", xp: receipt.data.xp_amount, oldXP: stats?.total_xp || 0, accuracy, questions: count }); return;
      } const result = data as unknown as { awarded: number; today_total: number }; awarded = result.awarded; setEarned(result.today_total); setCap(result.today_total >= 30 && awarded === 0); } playNodeComplete(); setFinish({ kind: "practice", moduleId: "", node: "practice_tab", title: "Practice", slug: "", tier: "", xp: awarded, oldXP: stats?.total_xp || 0, accuracy, questions: count }); }
    catch (e) { setRewardError(true); void reportError(e instanceof Error ? e : new Error("Practice reward failed")); } finally { saving.current = false; }
  };
  if (finish) return <><Suspense fallback={<PageSkeleton variant="learn"/>}><Finish data={{ ...finish, message: cap ? "Daily practice XP reached - this one's for you." : undefined }} onBack={back}/></Suspense></>;
  if (rewardError) return <BrandedEmptyState mascot="confused" headline="We couldn't save your practice reward." description="" ctaLabel="Try again" onCtaClick={() => summary.current && void complete(summary.current.accuracy, summary.current.total)}/>;
  if (loading || authLoading) return <PageSkeleton variant="learn"/>;
  if (error) return <BrandedEmptyState mascot="confused" headline="We couldn't load your practice." description="" ctaLabel="Try again" onCtaClick={() => mode ? void enter(mode) : void load()}/>;
  if (mode && !practiceUnlocked(badges)) return <BrandedEmptyState mascot="graduate" headline="Earn your first badge to unlock Practice." description="" ctaLabel="Back to my path" onCtaClick={() => navigate("/learn")}/>;
  if (mode && started) {
    const empty = mode === "mistakes" ? !questions.length : mode === "rapid" ? !rapid.length : mode === "flash" ? !cards.length : !sets.length;
    if (empty) return <BrandedEmptyState mascot="graduate" headline={mode === "mistakes" ? "No mistakes waiting - nice." : mode === "flash" && savedOnly ? "Save a key idea from any lesson and it will show up here." : "Finish a lesson to find something to practise."} description="" ctaLabel="Back to Practice" onCtaClick={back}/>;
    return <Suspense fallback={<PageSkeleton variant="learn"/>}>{mode === "mistakes" ? <Mistakes questions={questions} onComplete={(a,t) => void complete(a,t)} onExit={back}/> : mode === "rapid" ? <Rapid questions={rapid} timerOff={timerOff} onComplete={(a,t) => void complete(a,t)} onExit={back}/> : mode === "flash" ? <Flash cards={cards} onComplete={(a,t) => void complete(a,t)} onExit={back}/> : sets[0] ? <Match set={sets[0]} onComplete={(a,t) => void complete(a,t)} onExit={back}/> : null}</Suspense>;
  }
  const tiles: { mode: PracticeMode; title: string; line: string; icon: PathIconKind; tier: string }[] = [{ mode: "mistakes", title: "Mistakes", line: mistakes ? "Fix what you missed" : "No mistakes waiting - nice.", icon: "practice", tier: "relationships" }, { mode: "rapid", title: "Rapid fire", line: "True or false, fast", icon: "star", tier: "sexual_health" }, { mode: "flash", title: "Flash cards", line: "Flip through key ideas", icon: "lesson", tier: "foundation" }, ...(hasMatch ? [{ mode: "match" as const, title: "Quick match", line: "Pair ideas with meanings", icon: "story" as const, tier: "identity" }] : [])];
  return <div className="min-h-screen bg-background pb-[calc(112px+env(safe-area-inset-bottom))]"><LearnHeader stats={stats} earned={badges} total={total}/><LearnTabs practice/><main className="max-w-[480px] mx-auto px-4 py-3 space-y-4">{!practiceUnlocked(badges) ? <BrandedEmptyState mascot="graduate" headline="Earn your first badge to unlock Practice." description="" ctaLabel="Back to my path" onCtaClick={() => navigate("/learn")}/> : mode === "flash" ? <><h1 className="text-2xl font-bold">Flash cards</h1><label className="flex min-h-11 items-center justify-between gap-4"><Label htmlFor="saved-only">Saved only</Label><Switch id="saved-only" checked={savedOnly} onCheckedChange={value => { setSavedOnly(value); void enter("flash", value); }}/></label><Mascot mood="graduate" size="md" alt=""/>{!cards.length ? <BrandedEmptyState mascot="heart" headline={savedOnly ? "Save a key idea from any lesson and it will show up here." : "Complete a lesson to collect key ideas."} description="" ctaLabel="Back to my path" onCtaClick={() => navigate("/learn")}/> : <><p>{cards.length} key ideas</p><Button className="practice-answer w-full" onClick={() => setStarted(true)}>Start</Button></>}<Button variant="ghost" onClick={back}>Back to Practice</Button></> : <><div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Practice</h1><Mascot mood="binoculars" size="sm" alt=""/></div><div><p className="text-sm font-medium">Today: {earned} of 30 practice XP</p><div className="mt-2 h-1 rounded bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${Math.min(100, earned / 30 * 100)}%` }}/></div></div><label className="flex items-center justify-between min-h-11 gap-4"><Label htmlFor="practice-timer">Timer off</Label><Switch id="practice-timer" checked={timerOff} onCheckedChange={value => void timer(value)}/></label><div className="grid grid-cols-2 gap-4">{tiles.map((tile, i) => <m.div key={tile.mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? .1 : .3, delay: reduced ? 0 : i * .08 }}><PressScale><Button className={`practice-tile learn-tier learn-tier-${tile.tier}`} disabled={tile.mode === "mistakes" && !mistakes} onClick={() => void enter(tile.mode)}><span className="practice-tile-icon"><PathIcon kind={tile.icon}/></span><strong>{tile.title}</strong><span>{tile.line}</span>{tile.mode === "mistakes" && mistakes > 0 && <span className="practice-count">{mistakes}</span>}</Button></PressScale></m.div>)}</div></>}</main><BottomNav/></div>;
}
