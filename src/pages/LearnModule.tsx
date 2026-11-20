import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { EducationBadge } from "@/components/EducationBadge";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { SectionContent } from "@/components/education/SectionContent";
import { BrandedEmptyState } from "@/components/BrandedEmptyState";
import { reportError } from "@/lib/errorReporting";
import { latestQuizAnswers, type QuizAnswer, type QuizResult } from "@/lib/quizAnswers";
import { ExerciseSession } from "@/components/education/ExerciseSession";
import { lessonEntry } from "@/lib/learnLevels";
import { useSessionStore } from "@/stores/sessionStore";
import { XPPopup } from "@/components/education/XPPopup";
import { CelebrationModal } from "@/components/education/CelebrationModal";
import { ReadingProgress } from "@/components/education/ReadingProgress";
import { LessonPlayer, LessonPlayerSkeleton, LessonViewMenu } from "@/components/education/LessonPlayer";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { WhatYoullLearn } from "@/components/education/WhatYoullLearn";

import { useAntiCheat } from "@/hooks/useAntiCheat";
import { useModuleProgress } from "@/hooks/useModuleProgress";
import { useLearningStats, LEVEL_REWARDS } from "@/hooks/useLearningStats";
import { ChevronLeft, CheckCircle, CheckCircle2, XCircle, Award, BookOpen, Lock, Zap, Flame } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageSkeleton } from "@/components/PageSkeleton";
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
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [questionError, setQuestionError] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [submissionError, setSubmissionError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionAnswers, setSessionAnswers] = useState<QuizAnswer[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Quiz enhancements
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [showFeedback, setShowFeedback] = useState(false);

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
  const [xpPopup, setXpPopup] = useState<{ show: boolean; amount: number }>({ show: false, amount: 0 });
  const [celebration, setCelebration] = useState<{
    type: "level_up" | "streak_milestone" | "badge_earned" | "tier_complete" | null;
    level?: number;
    streak?: number;
    badgeTitle?: string;
    badgeSlug?: string;
    badgeTier?: string | null;
    isFoundationComplete?: boolean;
    tierName?: string;
  }>({ type: null });

  // Helper: after earning this badge, did the user just complete the
  // 5th Foundation badge (which unlocks Discovery)?
  const checkFoundationComplete = useCallback(async (justEarnedModuleId: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;
      const { data: foundationModules } = await supabase
        .from("education_modules")
        .select("id")
        .eq("tier", "foundation");
      if (!foundationModules || foundationModules.length === 0) return false;
      const foundationIds = new Set(foundationModules.map(m => m.id));
      // Only treat this as a Foundation completion if the badge we just
      // earned is itself a Foundation badge.
      if (!foundationIds.has(justEarnedModuleId)) return false;
      const { data: earnedBadges } = await supabase
        .from("user_badges")
        .select("module_id")
        .eq("user_id", session.user.id);
      if (!earnedBadges) return false;
      const earnedFoundationCount = earnedBadges.filter(b => foundationIds.has(b.module_id)).length;
      return earnedFoundationCount >= foundationModules.length;
    } catch (e) {
      console.error("Foundation completion check failed:", e);
      return false;
    }
  }, []);

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

  const { violations, violationCount, isDisqualified } = useAntiCheat({
    enabled: showQuiz && !submitted,
    onViolation: (type) => console.log(`Quiz violation detected: ${type}`),
  });

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
    const result = await awardXP(5, "reflection", sectionId);
    setXpPopup({ show: result.newXP > 0, amount: result.newXP });
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

  // Persist section completion before asking the server for its XP award.
  const handleSectionComplete = useCallback(async (sectionId: string) => {
    try {
      await markComplete(sectionId);
      const result = await awardXP(10, "section_complete", sectionId);
      setXpPopup({ show: result.newXP > 0, amount: result.newXP });

      if (result.leveledUp) {
        const newLevel = result.newLevel;
        setTimeout(() => setCelebration({ type: "level_up", level: newLevel }), 1600);

        const reward = LEVEL_REWARDS[newLevel];
        if (reward) {
          setTimeout(() => {
            toast.success(`${reward.icon} Level ${newLevel} reward: ${reward.label}!`, {
              description: "Added to your account automatically.",
              duration: 5000,
            });
          }, 2400);
        }
      } else if (result.streakMilestone) {
        setTimeout(() => setCelebration({ type: "streak_milestone", streak: result.newStreak }), 1600);
        try {
          await supabase.functions.invoke('grant-streak-reward', { body: { streak: result.newStreak } });
        } catch (e) {
          console.error("Failed to grant streak reward:", e);
        }
      }
      return result.newXP;
    } catch (error) {
      console.error("Section completion failed:", error);
      void reportError(error instanceof Error ? error : new Error("Section completion failed"));
      toast.error("Failed to save progress. Please try again.");
      return null;
    }
  }, [markComplete, awardXP, stats]);

  const handleSubmitQuiz = async (realAnswers: QuizAnswer[]) => {
    if (!module || !userId || submitting) return;
    setSessionAnswers(realAnswers);
    setSubmissionError(false);
    setSubmitting(true);
    let result: QuizResult;
    try {
      const answersArray = latestQuizAnswers(questions.map(q => q.id), realAnswers);
      const { data, error } = await supabase.rpc("submit_quiz", { _module_id: module.id, _answers: answersArray });
      if (error) throw error;
      result = data as unknown as QuizResult;
      if (!result || typeof result.passed !== "boolean" || typeof result.score !== "number") throw new Error("Invalid quiz result");
    } catch (error) {
      setSubmissionError(true);
      setSubmitting(false);
      void reportError(error instanceof Error ? error : new Error("Error submitting quiz"));
      return;
    }
    setQuizResult(result);
    setScore(result.score);
    setSubmitted(true);
    setSubmitting(false);
    if (result.passed) {
      void reloadProgress();
      const isFoundationComplete = await checkFoundationComplete(module.id);
      setTimeout(() => setCelebration({ type: "badge_earned", badgeTitle: module.title, badgeSlug: module.slug, badgeTier: module.tier, isFoundationComplete }), 1600);
      const xpResult = await awardXP(50 + (result.score === 100 ? 25 : 0), result.score === 100 ? "quiz_perfect" : "quiz_pass", module.id);
      setXpPopup({ show: xpResult.newXP > 0, amount: xpResult.newXP });
    }
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

  if (loading) {
    return <LessonPlayerSkeleton />;
  }
  if (progressLoading || viewLoading) return <LessonPlayerSkeleton />;
  if (progressError) return <BrandedEmptyState mascot="confused" headline="We couldn't load this lesson." description="" ctaLabel="Try again" onCtaClick={() => void reloadProgress()} />;
  if (questionError) return <BrandedEmptyState mascot="confused" headline="We couldn't load your quiz." description="" ctaLabel="Try again" onCtaClick={() => void loadModule()} />;
  if (!module) return null;

  const currentSection = sections[currentSectionIndex];
  if (!showQuiz && lessonView === "cards" && currentSection && userId) {
    return <>
      <SEO title={`${module.title} — Positive Thots Learn`} description={module.description.slice(0, 160)} path={`/learn/${module.slug}`} />
      <LessonPlayer key={currentSection.id} section={currentSection}
        checkpoints={checkpointQuestions.filter(q => q.section_id === currentSection.id).map(q => ({ id: q.id, question: q.question, options: q.options, position_in_section: q.position_in_section ?? 0 }))}
        initialIndex={sectionProgress.find(p => p.section_id === currentSection.id)?.last_card_index ?? 0}
        isCompleted={sectionProgress.some(p => p.section_id === currentSection.id && p.completed)} userId={userId}
        onSavePosition={index => void saveCardPosition(currentSection.id, index)} onExit={backToPath} onArticle={switchLessonView}
        onComplete={() => handleSectionComplete(currentSection.id)} onReflectionSaved={() => handleReflectionSaved(currentSection.id)}
        onNext={() => { if (currentSectionIndex < sections.length - 1) setCurrentSectionIndex(currentSectionIndex + 1); else setShowQuiz(true); }} />
      <XPPopup amount={xpPopup.amount} show={xpPopup.show} onDone={() => setXpPopup({ show: false, amount: 0 })} />
      <CelebrationModal type={celebration.type} level={celebration.level} streak={celebration.streak} onClose={() => setCelebration({ type: null })} />
    </>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const almostPassing = !submitted && answeredQuestions.size === questions.length - 1 && questions.length > 0;

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

      {/* XP Popup */}
      <XPPopup amount={xpPopup.amount} show={xpPopup.show} onDone={() => setXpPopup({ show: false, amount: 0 })} />
      {/* Celebration Modal */}
      <CelebrationModal
        type={celebration.type}
        level={celebration.level}
        streak={celebration.streak}
        badgeTitle={celebration.badgeTitle}
        badgeSlug={celebration.badgeSlug}
        badgeTier={celebration.badgeTier}
        isFoundationComplete={celebration.isFoundationComplete}
        tierName={celebration.tierName}
        onClose={() => setCelebration({ type: null })}
      />

      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={backToPath} aria-label="Go back">
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
                    onNext={() => {
                      if (currentSectionIndex < sections.length - 1) setCurrentSectionIndex(currentSectionIndex + 1);
                      else setShowQuiz(true);
                    }}
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
                          <p className="text-sm text-muted-foreground mb-4">Answer the questions to earn your badge. You need 80% to pass.</p>
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
                        <p className="text-sm text-muted-foreground mb-4">Answer the questions to earn your badge. You need 80% to pass.</p>
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
            {isDisqualified && !submitted ? (
              <Card className="border-destructive">
                <CardContent className="py-12 text-center">
                  <XCircle className="h-12 w-12 mx-auto text-destructive mb-3" />
                  <h3 className="font-semibold mb-2">Quiz Attempt Ended</h3>
                  <p className="text-muted-foreground mb-4">
                    This quiz attempt has been ended due to multiple violations.
                  </p>
                  <Button onClick={() => {
                    setShowQuiz(false);
                    setSubmitted(false);
                    setQuizResult(null);
                    setSessionAnswers([]);
                    setSubmissionError(false);
                    setAnswers({});
                    setCurrentQuestionIndex(0);
                    setAnsweredQuestions(new Set());
                    setShowFeedback(false);
                  }} variant="secondary">
                    Restart Quiz
                  </Button>
                </CardContent>
              </Card>
            ) : questions.length === 0 ? (
              <BrandedEmptyState mascot="graduate" headline="This quiz is on its way. Check back soon." description="" ctaLabel="Back to my path" onCtaClick={() => navigate("/learn")} />
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
                }))}
                userId={userId || ""}
                finalResult={quizResult}
                submitting={submitting}
                submissionError={submissionError}
                onRetrySubmit={() => void handleSubmitQuiz(sessionAnswers)}
                onComplete={(_score, _correct, _total, _passed, realAnswers) => void handleSubmitQuiz(realAnswers)}
                onBack={() => {
                  setShowQuiz(false);
                  setSubmitted(false);
                    setQuizResult(null);
                    setSessionAnswers([]);
                    setSubmissionError(false);
                  setAnswers({});
                  setCurrentQuestionIndex(0);
                  setAnsweredQuestions(new Set());
                  setShowFeedback(false);
                }}
              />
            )}

            {violationCount > 0 && (
              <p className="text-sm text-destructive text-center mt-2">⚠️ {violationCount} quiz integrity warning(s) recorded</p>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default LearnModule;
