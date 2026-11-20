import { GuideArt } from "@/components/mascot/GuideArt";
import { lazy, Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EducationBadge } from "@/components/EducationBadge";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { SectionContent } from "@/components/education/SectionContent";
import { BrandedEmptyState } from "@/components/BrandedEmptyState";
import { reportError } from "@/lib/errorReporting";
import { type QuizAnswer, type QuizResult } from "@/lib/quizAnswers";
import { ExerciseSession } from "@/components/education/ExerciseSession";
import { lessonEntry } from "@/lib/learnLevels";
import { useSessionStore } from "@/stores/sessionStore";
import { type FinishData } from "@/lib/learnFinish";
import { retryFinish } from "@/lib/finishRetry";
import { useFeatureUnlocks } from "@/hooks/useFeatureUnlocks";
const FinishSequence = lazy(() => import("@/components/education/FinishSequence"));

import { ReadingProgress } from "@/components/education/ReadingProgress";
import { LessonPlayer, LessonPlayerSkeleton, LessonViewMenu } from "@/components/education/LessonPlayer";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { WhatYoullLearn } from "@/components/education/WhatYoullLearn";

import type { MasteryResult } from "@/lib/quizMastery";
import { useModuleProgress } from "@/hooks/useModuleProgress";
import { useLearningStats } from "@/hooks/useLearningStats";
import { ChevronLeft, CheckCircle, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";
import DOMPurify from 'dompurify';

interface Module {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  video_url: string | null;
  tier: string | null;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  order_index: number;
  is_checkpoint?: boolean | null;
  position_in_section?: number | null;
  section_id?: string | null;
  exercise_type?: string;
}

const LearnModule = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appliedEntry = useRef<string | null>(null);
  
  const [module, setModule] = useState<Module | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [checkpointQuestions, setCheckpointQuestions] = useState<Question[]>([]);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [questionError, setQuestionError] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [submissionError, setSubmissionError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionAnswers, setSessionAnswers] = useState<QuizAnswer[]>([]);
  const [sessionStartedAt, setSessionStartedAt] = useState("");
  const [remaining, setRemaining] = useState<string[] | null>(null);
  const [reviewSession, setReviewSession] = useState(false);
  const masteryBusy = useRef(false);
  const leaveQuiz = useRef<(() => void) | null>(null);
  const registerLeave = useCallback((request: (() => void) | null) => { leaveQuiz.current = request; }, []);
  useEffect(() => {
    if (showQuiz) { setReviewSession(isAlreadyCompleted); setQuizResult(null); setRemaining(null); setSubmissionError(false); }
  }, [showQuiz]);
  const [userId, setUserId] = useState<string | null>(null);


  const { getPreference, setPreference } = useUserPreferences();
  const [lessonView, setLessonView] = useState<"cards" | "article">("cards");
  const [viewLoading, setViewLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setViewLoading(true);
    getPreference("lesson_view", "cards").then(value => {
      if (active) { setLessonView(value === "article" ? "article" : "cards"); setViewLoading(false); }
    });
    return () => { active = false; };
  }, [getPreference]);
  const switchLessonView = () => {
    const next = lessonView === "cards" ? "article" : "cards";
    setLessonView(next);
    void setPreference("lesson_view", next);
  };

  // XP & celebrations
  const { stats, awardXP } = useLearningStats();
  const [finish, setFinish] = useState<FinishData | null>(null);
  const { tiers } = useFeatureUnlocks();
  const awardRef = useRef(awardXP); awardRef.current = awardXP;
  const lessonStarted = useRef(Date.now());
  useEffect(() => { lessonStarted.current = Date.now(); }, [slug]);

  // Module progress for sections
  const [moduleId, setModuleId] = useState<string>("");
  const {
    sections,
    loading: progressLoading,
    error: progressError,
    saveCardPosition,
    progress: sectionProgress,
    currentSectionIndex,
    setCurrentSectionIndex,
    markComplete,
    isAllComplete: allSectionsComplete,
    completionPercent,
    hasSections,
    reload: reloadProgress,
  } = useModuleProgress(moduleId);

  useEffect(() => {
    loadModule();
  }, [slug]);

  useEffect(() => {
    if (progressLoading || !sections.length || loading || sections.some(section => section.module_id !== moduleId)) return;
    const key = `${moduleId}:${searchParams.toString()}`;
    if (appliedEntry.current === key) return;
    appliedEntry.current = key;
    if (!searchParams.has("section") && !searchParams.has("quiz")) return;
    const entry = lessonEntry(sections, new Set(sectionProgress.filter(p => p.completed).map(p => p.section_id)), searchParams.get("section"), searchParams.get("quiz"));
    setCurrentSectionIndex(entry.index);
    setShowQuiz(entry.quiz);
    if (entry.blockedQuiz) toast.info("Finish the lessons first, you're almost there.");
  }, [progressLoading, sections, sectionProgress, loading, moduleId, searchParams]);

  const backToPath = () => {
    const node = showQuiz ? `quiz:${moduleId}` : sections[currentSectionIndex]?.id;
    if (node) useSessionStore.getState().setSessionData("learn-return-node", node);
    navigate("/learn");
  };

  // Cancel speech synthesis when section changes or component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [currentSectionIndex]);

  const handleReflectionSaved = useCallback(async (sectionId: string) => {
    await awardXP(5, "reflection", sectionId);
  }, [awardXP]);

  const loadModule = async () => {
    setLoading(true);
    setQuestionError(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);

      const { data: moduleData, error: moduleError } = await supabase
        .from("education_modules").select("*").eq("slug", slug).single();
      if (moduleError || !moduleData) {
        toast.error("Course not found");
        navigate("/learn");
        return;
      }
      setModule(moduleData);
      setModuleId(moduleData.id);

      const [questionsResult, badgeResult] = await Promise.all([
        supabase.rpc("get_quiz_questions", { _module_id: moduleData.id }),
        supabase.from("user_badges").select("id").eq("user_id", session.user.id).eq("module_id", moduleData.id).maybeSingle()
      ]);
      if (questionsResult.error) throw questionsResult.error;
      
      const parsedQuestions = (questionsResult.data || []).map(q => ({
        ...q,
        options: (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) as string[]
      }));
      // Split into badge quiz questions and checkpoint questions
      const badge = parsedQuestions.filter(q => !q.is_checkpoint);
      const checkpoints = parsedQuestions.filter(q => q.is_checkpoint);
      setQuestions(badge);
      setCheckpointQuestions(checkpoints);
      setIsAlreadyCompleted(!!badgeResult.data);
    } catch (error: any) {
      console.error("Error loading module:", error);
      setQuestionError(true);
      void reportError(new Error(error.message || "Error loading quiz"));
    } finally {
      setLoading(false);
    }
  };

  // Completion is saved before rewards; retries outlive this screen.
  const sectionBusy = useRef(false);
  const handleSectionComplete = useCallback(async (sectionId: string) => {
    if (sectionBusy.current) return 0;
    sectionBusy.current = true;
    const section = sections.find(s => s.id === sectionId);
    const repeat = sectionProgress.some(p => p.section_id === sectionId && p.completed);
    const checkpoints = checkpointQuestions.filter(q => q.section_id === sectionId);
    const today = new Date().toISOString().slice(0, 10);
    let firstToday = false;
    let checkpointCount = 0;
    const base: FinishData = {
      kind: "lesson", moduleId, node: `lesson-${section?.section_number || 1}`,
      title: module?.title || "", slug: module?.slug || "", tier: module?.tier || "foundation",
      xp: repeat ? 0 : null, oldXP: stats?.total_xp || 0, oldStreak: stats?.current_streak || 0,
      checkpointTotal: checkpoints.length, checkpoints: 0,
      seconds: Math.round((Date.now() - lessonStarted.current) / 1000),
      lessonsDone: new Set([...sectionProgress.filter(p => p.completed).map(p => p.section_id), sectionId]).size,
      lessonTotal: sections.length, saving: !repeat,
    };
    let saved = repeat;
    const persist = async () => {
      if (!saved) { await markComplete(sectionId); saved = true; }
      const result = await awardRef.current(10, "section_complete", sectionId, true);
      setFinish(previous => previous ? { ...previous, xp: result.newXP, newXP: result.totalXP,
        saving: false, firstLessonToday: firstToday && !repeat, streak: result.newStreak,
        level: result.leveledUp ? result.newLevel : undefined } : previous);
      return result.newXP;
    };
    try {
      if (userId) {
        const [daily, performance] = await Promise.all([
          supabase.from("user_section_progress").select("section_id", { count: "exact", head: true }).eq("user_id", userId).eq("completed", true).gte("last_accessed", `${today}T00:00:00Z`),
          supabase.from("user_quiz_performance").select("question_id").eq("user_id", userId).in("question_id", checkpoints.map(q => q.id)),
        ]);
        firstToday = !daily.error && daily.count === 0;
        checkpointCount = new Set(performance.data?.map(p => p.question_id)).size;
      }
      base.checkpoints = checkpointCount;
      if (repeat) { setFinish({ ...base, saving: false }); return 0; }
      await markComplete(sectionId); saved = true;
      setFinish({ ...base, firstLessonToday: firstToday });
      return await persist();
    } catch (error) {
      void reportError(error instanceof Error ? error : new Error("Lesson finish failed"));
      setFinish(previous => previous || { ...base, saving: true });
      retryFinish(`lesson:${userId}:${sectionId}`, async () => { await persist(); });
      return 0;
    } finally { sectionBusy.current = false; }
  }, [sections, sectionProgress, checkpointQuestions, moduleId, module, stats, userId, markComplete]);

  const handleSubmitQuiz = async (realAnswers: QuizAnswer[], startedAt: string, reviewSummary?: QuizResult, background = false) => {
    if (!module || !userId || masteryBusy.current) return;
    setSessionAnswers(realAnswers); setSessionStartedAt(startedAt); setSubmissionError(false); setRemaining(null);
    if (reviewSession) {
      if (reviewSummary) setFinish({ kind: "review", moduleId, node: "badge", title: module.title, slug: module.slug, tier: module.tier || "foundation", xp: 0, oldXP: stats?.total_xp || 0, accuracy: reviewSummary.score, questions: reviewSummary.total });
      return;
    }
    masteryBusy.current = true; setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("complete_module_mastery", { _module_id: module.id, _session_started_at: startedAt });
      if (error) throw error;
      const result = data as unknown as MasteryResult;
      if (!result || typeof result.passed !== "boolean") throw new Error("Invalid mastery result");
      if (!result.passed) { setFinish(null); setRemaining(result.remaining || []); return; }
      if (typeof result.score !== "number" || typeof result.first_try_correct !== "number" || typeof result.total !== "number") throw new Error("Invalid mastery score");
      setQuizResult({ score: result.score, correct: result.first_try_correct, total: result.total, passed: true });
      setIsAlreadyCompleted(true);
      void reloadProgress();
      const base: FinishData = { kind: "badge", moduleId, node: "badge", title: module.title, slug: module.slug, tier: module.tier || "foundation", xp: null, oldXP: stats?.total_xp || 0, accuracy: result.score, questions: result.total, saving: true };
      setFinish(base);
      const reward = async () => {
        const tier = tiers.find(t => t.tier === module.tier);
        const { data: badges, error: badgeError } = await supabase.from("user_badges").select("module_id").eq("user_id", userId);
        const { data: tierModules, error: tierError } = await supabase.from("education_modules").select("id").eq("tier", module.tier || "foundation");
        if (badgeError || tierError) throw badgeError || tierError;
        const ids = new Set(badges?.map(b => b.module_id));
        const tierComplete = Boolean(tierModules?.length && tierModules.every(m => ids.has(m.id)));
        const xp = await awardRef.current(result.score === 100 ? 75 : 50, result.score === 100 ? "quiz_perfect" : "quiz_pass", module.id, true);
        setFinish(previous => previous ? { ...previous, xp: xp.newXP, newXP: xp.totalXP, level: xp.leveledUp ? xp.newLevel : undefined, tierComplete, tierLabel: tier?.label || module.tier || "", features: tier?.features.map(f => f.label) || [], saving: false } : previous);
      };
      try { await reward(); } catch (error) { void reportError(error instanceof Error ? error : new Error("Badge reward failed")); retryFinish(`badge:${userId}:${moduleId}`, reward); }
    } catch (error) {
      setSubmissionError(true);
      void reportError(error instanceof Error ? error : new Error("Could not save mastery"));
      if (background) throw error;
      setFinish({ kind: "review", moduleId, node: "badge", title: module.title, slug: module.slug, tier: module.tier || "foundation", xp: null, oldXP: stats?.total_xp || 0, accuracy: reviewSummary?.score, questions: questions.length, saving: true });
      retryFinish(`mastery:${userId}:${moduleId}`, () => handleSubmitQuiz(realAnswers, startedAt, reviewSummary, true));
    } finally { masteryBusy.current = false; setSubmitting(false); }
  };

  const handleRefresh = () => { loadModule(); reloadProgress(); };

  const renderContent = (content: string) => {
    return content.split('\n\n').map((paragraph, i) => {
      if (paragraph.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-6 mb-3">{paragraph.slice(3)}</h2>;
      if (paragraph.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{paragraph.slice(4)}</h3>;
      if (paragraph.startsWith('- ')) {
        const items = paragraph.split('\n').filter(line => line.startsWith('- '));
        return (
          <ul key={i} className="list-disc list-inside space-y-1 mb-4">
            {items.map((item, j) => <li key={j}>{item.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}</li>)}
          </ul>
        );
      }
      const escapeHtml = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      const withLinks = paragraph.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        (_, text, url) => {
          const trimmed = url.trim().toLowerCase();
          const safe = (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) ? '#' : url;
          return `<a href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer" class="text-secondary underline hover:text-secondary/80">${escapeHtml(text)}</a>`;
        }
      );
      return <p key={i} className="mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(withLinks) }} />;
    });
  };

  const canTakeQuiz = !hasSections || allSectionsComplete;

  if (finish) return <Suspense fallback={<LessonPlayerSkeleton />}><FinishSequence data={finish}
    onBack={() => { useSessionStore.getState().setSessionData("learn-return-node", null); navigate("/learn", { state: { justCompleted: { moduleId: finish.moduleId, node: finish.node, oldXP: finish.oldXP } } }); }}
    onDiscovery={() => navigate("/")} /></Suspense>;
  if (loading) {
    return <LessonPlayerSkeleton />;
  }
  if ((progressLoading && !showQuiz) || viewLoading) return <LessonPlayerSkeleton />;
  if (progressError) return <BrandedEmptyState illustration={<GuideArt name="guide-encourage" size={160}/>} mascot="confused" headline="We couldn't load this lesson." description="" ctaLabel="Try again" onCtaClick={() => void reloadProgress()} />;
  if (questionError) return <BrandedEmptyState illustration={<GuideArt name="guide-encourage" size={160}/>} mascot="confused" headline="We couldn't load your quiz." description="" ctaLabel="Try again" onCtaClick={() => void loadModule()} />;
  if (!module) return null;

  const currentSection = sections[currentSectionIndex];
  if (!showQuiz && lessonView === "cards" && currentSection && userId) {
    return <>
      <SEO title={`${module.title} — Positive Thots Learn`} description={module.description.slice(0, 160)} path={`/learn/${module.slug}`} />
      <LessonPlayer key={currentSection.id} section={currentSection}
        checkpoints={checkpointQuestions.filter(q => q.section_id === currentSection.id).map(q => ({ id: q.id, question: q.question, options: q.options, position_in_section: q.position_in_section ?? 0 }))}
        initialIndex={sectionProgress.find(p => p.section_id === currentSection.id)?.last_card_index ?? 0}
        isCompleted={sectionProgress.some(p => p.section_id === currentSection.id && p.completed)} userId={userId} tier={module.tier}
        onSavePosition={index => void saveCardPosition(currentSection.id, index)} onExit={backToPath} onArticle={switchLessonView}
        onComplete={() => handleSectionComplete(currentSection.id)} onReflectionSaved={() => handleReflectionSaved(currentSection.id)}
        onNext={() => {}} />
    </>;
  }


  return (
    <div className="min-h-screen bg-background flex flex-col">
      {module && (
        <SEO
          title={`${module.title} — Positive Thots Learn`}
          description={(module.description || `Learn about ${module.title} on Positive Thots.`).slice(0, 160)}
          path={`/learn/${module.slug}`}
          type="article"
          jsonLd={{
            "@context": "https://schema.org",
            "@type": "Course",
            name: module.title,
            description: module.description,
            provider: {
              "@type": "Organization",
              name: "Positive Thots",
              sameAs: "https://positivethots.app",
            },
          }}
        />
      )}
      {/* Reading progress bar */}
      {!showQuiz && <ReadingProgress />}

      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => showQuiz ? leaveQuiz.current?.() : backToPath()} aria-label={showQuiz ? "Leave badge check" : "Go back"}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold truncate">{module.title}</h1>
            <p className="text-sm text-muted-foreground truncate">{module.description}</p>
          </div>
          {!showQuiz && <LessonViewMenu article={true} onSwitch={switchLessonView} />}
          <EducationBadge
            moduleSlug={module.slug} title={module.title}
            isEarned={isAlreadyCompleted || quizResult?.passed === true}
            tier={module.tier || 'foundation'} size="md"
          />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-6">
        <AdminPanel module={module} questions={questions} onUpdate={handleRefresh} />

        {/* What You'll Learn preview */}
        {!showQuiz && (
          <WhatYoullLearn
            moduleSlug={module.slug}
            tier={module.tier || "foundation"}
            estimatedMinutes={(module as any).estimated_minutes}
          />
        )}
        {!showQuiz ? (
          <>
            {hasSections ? (
              <>
                {/* Section progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Module progress</span>
                    <span className="font-medium">{completionPercent}%</span>
                  </div>
                  <Progress value={completionPercent} className="h-2" />
                </div>

                <p className="mb-4 text-sm text-muted-foreground">Lesson {currentSectionIndex + 1} of {sections.length}</p>

                {/* Current section */}
                {sections[currentSectionIndex] && (
                  <SectionContent
                    section={sections[currentSectionIndex]}
                    isCompleted={sectionProgress.some(p => p.section_id === sections[currentSectionIndex].id && p.completed)}
                    onComplete={() => handleSectionComplete(sections[currentSectionIndex].id)}
                    onNext={() => {}}
                    onPrev={() => { if (currentSectionIndex > 0) setCurrentSectionIndex(currentSectionIndex - 1); }}
                    isFirst={currentSectionIndex === 0}
                    isLast={currentSectionIndex === sections.length - 1}
                    totalSections={sections.length}
                    reflectionPrompt={sections[currentSectionIndex].reflection_prompt}
                    userId={userId || undefined}
                    onReflectionSaved={() => handleReflectionSaved(sections[currentSectionIndex].id)}
                    checkpointQuestions={checkpointQuestions
                      .filter(q => q.section_id === sections[currentSectionIndex].id)
                      .map(q => ({
                        id: q.id,
                        question: q.question,
                        options: q.options,
                        position_in_section: q.position_in_section ?? 0,
                      }))}
                  />
                )}

                {/* Visible Take Quiz fallback when all sections complete */}
                {canTakeQuiz && !showQuiz && (
                  <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-0 mt-6">
                    <CardContent className="pt-6 text-center">
                      {isAlreadyCompleted ? (
                        <>
                          <CheckCircle className="h-12 w-12 mx-auto text-success mb-3" />
                          <h3 className="font-semibold mb-2">Already Completed!</h3>
                          <p className="text-sm text-muted-foreground mb-4">You've already earned this badge. Want to review the quiz?</p>
                          <Button onClick={() => setShowQuiz(true)} variant="outline">Review Quiz</Button>
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-12 w-12 mx-auto text-primary mb-3" />
                          <h3 className="font-semibold mb-2">All Sections Complete! Ready for the Quiz?</h3>
                          <p className="text-sm text-muted-foreground mb-4">Master each question to earn your badge. Take your time.</p>
                          <Button onClick={() => setShowQuiz(true)}>Take Quiz</Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <>
                {module.video_url && (
                  <div className="mb-8">
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <iframe src={module.video_url} title={`${module.title} - Video`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen className="w-full h-full" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 text-center">Watch the video above, then read the material below</p>
                  </div>
                )}
                <div className="prose prose-sm max-w-none mb-8">{renderContent(module.content)}</div>
                <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-0">
                  <CardContent className="pt-6 text-center">
                    {isAlreadyCompleted ? (
                      <>
                        <CheckCircle className="h-12 w-12 mx-auto text-success mb-3" />
                        <h3 className="font-semibold mb-2">Already Completed!</h3>
                        <p className="text-sm text-muted-foreground mb-4">You've already earned this badge. Want to review the quiz?</p>
                        <Button onClick={() => setShowQuiz(true)} variant="outline">Review Quiz</Button>
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-12 w-12 mx-auto text-primary mb-3" />
                        <h3 className="font-semibold mb-2">Ready for the Quiz?</h3>
                        <p className="text-sm text-muted-foreground mb-4">Master each question to earn your badge. Take your time.</p>
                        <Button onClick={() => setShowQuiz(true)}>Take Quiz</Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </>
        ) : (
          <>
            {/* Exercise Session - mixed exercise types */}
            {questions.length === 0 ? (
              <BrandedEmptyState illustration={<GuideArt name="guide-waving" size={160}/>} mascot="graduate" headline="This quiz is on its way. Check back soon." description="" ctaLabel="Back to my path" onCtaClick={() => navigate("/learn")} />
            ) : (
              <ExerciseSession
                moduleId={module.id}
                moduleTitle={module.title}
                questions={questions.map(q => ({
                  id: q.id,
                  question: q.question,
                  options: q.options,
                  exercise_type: q.exercise_type || "multiple_choice",
                  order_index: q.order_index,
                  section_id: q.section_id,
                }))}
                userId={userId || ""}
                finalResult={quizResult}
                submitting={submitting}
                submissionError={submissionError}
                review={reviewSession} remaining={remaining} onLeaveRequestReady={registerLeave}
                onRetrySubmit={() => void handleSubmitQuiz(sessionAnswers, sessionStartedAt)}
                onComplete={(score, correct, total, _passed, realAnswers, startedAt) => void handleSubmitQuiz(realAnswers, startedAt, { score, correct, total, passed: true })}
                onBack={() => { setShowQuiz(false); setQuizResult(null); setSessionAnswers([]); setRemaining(null); setSubmissionError(false); }}
              />
            )}

          </>
        )}
      </main>
    </div>
  );
};

export default LearnModule;
