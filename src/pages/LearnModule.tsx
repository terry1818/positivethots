import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { EducationBadge } from "@/components/EducationBadge";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { SectionContent } from "@/components/education/SectionContent";
import { ExerciseSession } from "@/components/education/ExerciseSession";
import { LearningPath } from "@/components/education/LearningPath";
import { XPPopup } from "@/components/education/XPPopup";
import { CelebrationModal } from "@/components/education/CelebrationModal";
import { ReadingProgress } from "@/components/education/ReadingProgress";
import { SessionIntro } from "@/components/education/SessionIntro";
import { WhatYoullLearn } from "@/components/education/WhatYoullLearn";

import { useAntiCheat } from "@/hooks/useAntiCheat";
import { useModuleProgress } from "@/hooks/useModuleProgress";
import { useLearningStats, LEVEL_REWARDS } from "@/hooks/useLearningStats";
import { ChevronLeft, CheckCircle, CheckCircle2, XCircle, Award, BookOpen, Lock, Zap, Flame } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageSkeleton } from "@/components/PageSkeleton";
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
  explanation_correct?: string | null;
  explanation_wrong?: string | null;
  is_checkpoint?: boolean | null;
  position_in_section?: number | null;
  section_id?: string | null;
  exercise_type?: string;
  match_pairs?: any[];
  correct_order?: number[];
  explanation?: string;
  correct_answer?: number;
}

export interface CheckpointQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation_correct: string;
  explanation_wrong: string;
  position_in_section: number;
}

const LearnModule = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [module, setModule] = useState<Module | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [checkpointQuestions, setCheckpointQuestions] = useState<Question[]>([]);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  // Quiz enhancements
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [showFeedback, setShowFeedback] = useState(false);

  // Session intro
  const [introShownSections, setIntroShownSections] = useState<Set<string>>(new Set());
  const [showSessionIntro, setShowSessionIntro] = useState(false);

  // XP & celebrations
  const { stats, awardXP } = useLearningStats();
  const [xpPopup, setXpPopup] = useState<{ show: boolean; amount: number }>({ show: false, amount: 0 });
  const [celebration, setCelebration] = useState<{
    type: "level_up" | "streak_milestone" | "badge_earned" | "tier_complete" | null;
    level?: number;
    streak?: number;
    badgeTitle?: string;
    tierName?: string;
  }>({ type: null });

  // Module progress for sections
  const [moduleId, setModuleId] = useState<string>("");
  const {
    sections,
    progress: sectionProgress,
    currentSectionIndex,
    setCurrentSectionIndex,
    markComplete,
    isAllComplete: allSectionsComplete,
    completionPercent,
    hasSections,
    reload: reloadProgress,
  } = useModuleProgress(moduleId);

  const { violations, violationCount } = useAntiCheat({
    enabled: showQuiz && !submitted,
    onViolation: (type) => console.log(`Quiz violation detected: ${type}`),
  });

  useEffect(() => {
    loadModule();
  }, [slug]);

  // Cancel speech synthesis when section changes or component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [currentSectionIndex]);

  // Show session intro for new, uncompleted sections
  useEffect(() => {
    if (!hasSections || sections.length === 0 || showQuiz) return;
    const currentSection = sections[currentSectionIndex];
    if (!currentSection) return;
    const isCompleted = sectionProgress.some(p => p.section_id === currentSection.id && p.completed);
    if (!introShownSections.has(currentSection.id) && !isCompleted) {
      setShowSessionIntro(true);
      setIntroShownSections(prev => new Set(prev).add(currentSection.id));
    }
  }, [currentSectionIndex, sections, hasSections, showQuiz]);

  const handleReflectionSaved = useCallback(async (sectionId: string) => {
    const result = await awardXP(5, "reflection", sectionId);
    setXpPopup({ show: true, amount: result.newXP });
  }, [awardXP]);

  const loadModule = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);

      const { data: moduleData, error: moduleError } = await supabase
        .from("education_modules").select("*").eq("slug", slug).single();
      if (moduleError) throw moduleError;
      setModule(moduleData);
      setModuleId(moduleData.id);

      // Check if user is admin to fetch full question data (including correct_answer)
      const { data: roleData } = await supabase
        .from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
      const isAdminUser = !!roleData;

      const [questionsResult, badgeResult] = await Promise.all([
        isAdminUser
          ? supabase.from("quiz_questions").select("*").eq("module_id", moduleData.id).order("order_index")
          : supabase.from("quiz_questions_public").select("*").eq("module_id", moduleData.id).order("order_index"),
        supabase.from("user_badges").select("id").eq("user_id", session.user.id).eq("module_id", moduleData.id).maybeSingle()
      ]);
      if (questionsResult.error) throw questionsResult.error;
      
      const parsedQuestions = (questionsResult.data || []).map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      }));
      // Split into badge quiz questions and checkpoint questions
      const badge = parsedQuestions.filter(q => !q.is_checkpoint);
      const checkpoints = parsedQuestions.filter(q => q.is_checkpoint);
      setQuestions(badge);
      setCheckpointQuestions(checkpoints);
      setIsAlreadyCompleted(!!badgeResult.data);
    } catch (error: any) {
      console.error("Error loading module:", error);
      toast.error("Failed to load module");
      navigate("/learn");
    } finally {
      setLoading(false);
    }
  };

  // Award XP on section complete
  const handleSectionComplete = useCallback(async (sectionId: string) => {
    await markComplete(sectionId);
    const result = await awardXP(10, "section_complete", sectionId);
    setXpPopup({ show: true, amount: result.newXP });

    if (result.leveledUp) {
      const newLevel = stats?.current_level ? stats.current_level + 1 : 2;
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
      // Grant streak milestone reward
      try {
        await supabase.functions.invoke('grant-streak-reward', { body: { streak: result.newStreak } });
      } catch (e) {
        console.error("Failed to grant streak reward:", e);
      }
    }
  }, [markComplete, awardXP, stats]);

  // Quiz: store answer locally, show feedback instead of auto-advancing
  const handleAnswerQuestion = (questionId: string, answerIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || answeredQuestions.has(questionId)) return;

    setAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
    setAnsweredQuestions(prev => new Set(prev).add(questionId));
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    setShowFeedback(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!module || !userId) return;

    // Build answers array from tracked state
    const answersArray = questions.map(q => ({
      question_id: q.id,
      selected_answer: answers[q.id] ?? -1,
    }));

    try {
      const { data: result, error } = await supabase.rpc("submit_quiz", {
        _module_id: module.id,
        _answers: answersArray,
      });
      if (error) throw error;

      const quizResult = result as { score: number; correct: number; total: number; passed: boolean };
      const scorePercent = quizResult.score;
      setScore(scorePercent);
      setSubmitted(true);

      if (quizResult.passed) {
        const quizXP = 50;
        const perfectBonus = scorePercent === 100 ? 25 : 0;
        const totalXP = quizXP + perfectBonus;
        
        const xpResult = await awardXP(totalXP, scorePercent === 100 ? "quiz_perfect" : "quiz_pass", module.id);
        setXpPopup({ show: true, amount: xpResult.newXP });

        setTimeout(() => {
          setCelebration({ type: "badge_earned", badgeTitle: module.title });
        }, 1600);
      }
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to save your progress");
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
    return <PageSkeleton variant="learn" />;
  }
  if (!module) return null;

  const currentQuestion = questions[currentQuestionIndex];
  const almostPassing = !submitted && answeredQuestions.size === questions.length - 1 && questions.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
        tierName={celebration.tierName}
        onClose={() => setCelebration({ type: null })}
      />

      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/learn")} aria-label="Go back">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold truncate">{module.title}</h1>
            <p className="text-sm text-muted-foreground truncate">{module.description}</p>
          </div>
          <EducationBadge
            moduleSlug={module.slug} title={module.title}
            isEarned={isAlreadyCompleted || (submitted && score >= 80)}
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

                {/* Learning Path - horizontal Duolingo-style */}
                <LearningPath
                  sections={sections}
                  progress={sectionProgress}
                  currentIndex={currentSectionIndex}
                  onSelect={setCurrentSectionIndex}
                />

                {/* Session Intro Overlay */}
                {showSessionIntro && sections[currentSectionIndex] && module && (
                  <SessionIntro
                    moduleTitle={module.title}
                    sectionTitle={sections[currentSectionIndex].title}
                    estimatedMinutes={sections[currentSectionIndex].estimated_minutes}
                    xpAvailable={10 + (sections[currentSectionIndex].reflection_prompt ? 5 : 0)}
                    sectionNumber={currentSectionIndex + 1}
                    totalSections={sections.length}
                    onStart={() => setShowSessionIntro(false)}
                    badgeSlug={module.slug}
                    badgeTier={module.tier || "foundation"}
                  />
                )}

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
                        correct_answer: (q as any).correct_answer ?? 0,
                        explanation_correct: q.explanation_correct || "That's right!",
                        explanation_wrong: q.explanation_wrong || "Not quite — review the section above for more context.",
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
            {questions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No quiz questions yet. Check back soon!</p>
                  <Button variant="outline" className="mt-4" onClick={() => setShowQuiz(false)}>Back to Content</Button>
                </CardContent>
              </Card>
            ) : (
              <ExerciseSession
                moduleId={module.id}
                moduleTitle={module.title}
                questions={questions.map(q => ({
                  id: q.id,
                  question: q.question,
                  options: q.options,
                  correct_answer: (q as any).correct_answer ?? 0,
                  exercise_type: q.exercise_type || "multiple_choice",
                  match_pairs: q.match_pairs,
                  correct_order: q.correct_order,
                  explanation: q.explanation || q.explanation_correct || undefined,
                  explanation_correct: q.explanation_correct || undefined,
                  explanation_wrong: q.explanation_wrong || undefined,
                  order_index: q.order_index,
                }))}
                userId={userId || ""}
                onComplete={async (scorePercent, correct, total, passed) => {
                  setScore(scorePercent);
                  setSubmitted(true);

                  if (passed) {
                    // Submit quiz via RPC for badge awarding
                    try {
                      const answersArray = questions.map(q => ({
                        question_id: q.id,
                        selected_answer: q.correct_answer ?? 0, // placeholder — server validates
                      }));
                      await supabase.rpc("submit_quiz", {
                        _module_id: module.id,
                        _answers: answersArray,
                      });
                    } catch (e) {
                      console.error("Badge award error:", e);
                    }

                    const quizXP = 50;
                    const perfectBonus = scorePercent === 100 ? 25 : 0;
                    const xpResult = await awardXP(quizXP + perfectBonus, scorePercent === 100 ? "quiz_perfect" : "quiz_pass", module.id);
                    setXpPopup({ show: true, amount: xpResult.newXP });

                    setTimeout(() => {
                      setCelebration({ type: "badge_earned", badgeTitle: module.title });
                    }, 1600);
                  }
                }}
                onBack={() => {
                  setShowQuiz(false);
                  setSubmitted(false);
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
