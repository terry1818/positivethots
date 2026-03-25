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
import { LearningPath } from "@/components/education/LearningPath";
import { XPPopup } from "@/components/education/XPPopup";
import { CelebrationModal } from "@/components/education/CelebrationModal";
import { ReadingProgress } from "@/components/education/ReadingProgress";

import { useAntiCheat } from "@/hooks/useAntiCheat";
import { useModuleProgress } from "@/hooks/useModuleProgress";
import { useLearningStats } from "@/hooks/useLearningStats";
import { ChevronLeft, CheckCircle, Award, BookOpen, Lock, Zap, Flame } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageSkeleton } from "@/components/PageSkeleton";

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
      setQuestions(parsedQuestions);
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
      setTimeout(() => setCelebration({ type: "level_up", level: stats?.current_level ? stats.current_level + 1 : 2 }), 1600);
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

  // Quiz: store answer locally (no server-side validation per question)
  const handleAnswerQuestion = (questionId: string, answerIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || answeredQuestions.has(questionId)) return;

    setAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
    setAnsweredQuestions(prev => new Set(prev).add(questionId));

    // Auto-advance after brief delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    }, 400);
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
      return <p key={i} className="mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: withLinks }} />;
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
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
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
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-6">
        <AdminPanel module={module} questions={questions} onUpdate={handleRefresh} />

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
            {/* Quiz */}
            {!submitted ? (
              <div className="space-y-6">
                {/* Quiz header with progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold">Quiz: {module.title}</h2>
                  </div>
                  {questions.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                        <span>{answeredQuestions.size}/{questions.length} answered</span>
                      </div>
                      <Progress value={(answeredQuestions.size / questions.length) * 100} className="h-2" />
                    </div>
                  )}
                </div>

                {/* Almost there encouragement */}
                {almostPassing && (
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-center animate-bounce-in">
                    <p className="text-sm font-bold text-accent">🎯 Almost there! One more question!</p>
                  </div>
                )}

                {questions.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No quiz questions yet. Check back soon!</p>
                      <Button variant="outline" className="mt-4" onClick={() => setShowQuiz(false)}>Back to Content</Button>
                    </CardContent>
                  </Card>
                ) : currentQuestion ? (
                  <>
                    {/* Single question view */}
                    <Card className="transition-all">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {currentQuestionIndex + 1}. {currentQuestion.question}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup
                          value={answers[currentQuestion.id] !== undefined ? answers[currentQuestion.id].toString() : ""}
                          onValueChange={(value) => handleAnswerQuestion(currentQuestion.id, parseInt(value))}
                          disabled={answeredQuestions.has(currentQuestion.id)}
                        >
                          {currentQuestion.options.map((option: string, oIndex: number) => {
                            const isSelected = answers[currentQuestion.id] === oIndex;
                            return (
                              <div key={oIndex} className={cn(
                                "flex items-center space-x-2 py-2 px-2 rounded-md transition-colors",
                                isSelected && "bg-primary/10"
                              )}>
                                <RadioGroupItem value={oIndex.toString()} id={`${currentQuestion.id}-${oIndex}`} />
                                <Label htmlFor={`${currentQuestion.id}-${oIndex}`} className="flex-1 cursor-pointer">{option}</Label>
                              </div>
                            );
                          })}
                        </RadioGroup>
                      </CardContent>
                    </Card>

                    {/* Navigation dots with fire trail */}
                    <div className="flex justify-center gap-1.5 flex-wrap">
                      {questions.map((q, i) => {
                        const isAnswered = answeredQuestions.has(q.id);
                        return (
                          <button
                            key={q.id}
                            onClick={() => setCurrentQuestionIndex(i)}
                            className={cn(
                              "w-3 h-3 rounded-full transition-all",
                              i === currentQuestionIndex ? "bg-primary scale-125" :
                              isAnswered ? "bg-muted-foreground" :
                              "bg-muted"
                            )}
                          />
                        );
                      })}
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setShowQuiz(false)} className="flex-1">
                        Back to {hasSections ? "Sections" : "Reading"}
                      </Button>
                      <Button
                        onClick={handleSubmitQuiz}
                        disabled={answeredQuestions.size !== questions.length}
                        className="flex-1"
                      >
                        Submit ({answeredQuestions.size}/{questions.length})
                      </Button>
                    </div>
                    {violationCount > 0 && (
                      <p className="text-xs text-destructive text-center mt-2">⚠️ {violationCount} quiz integrity warning(s) recorded</p>
                    )}
                  </>
                ) : null}
              </div>
            ) : (
              // Enhanced Results
              <Card className={score >= 80 ? "border-success" : "border-destructive"}>
                <CardContent className="pt-6 text-center">
                  {score >= 80 ? (
                    <>
                      <Award className="h-16 w-16 mx-auto text-success mb-4 animate-bounce-in" />
                      <h2 className="text-2xl font-bold mb-2">Congratulations! 🎉</h2>
                      <p className="text-lg mb-2">You scored {score}%</p>

                      {/* XP breakdown */}
                      <div className="bg-muted/50 rounded-lg p-4 mb-4 text-left space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-1">
                          <Zap className="h-4 w-4 text-accent" /> XP Earned
                        </h4>
                        <div className="flex justify-between text-sm">
                          <span>Quiz passed</span>
                          <span className="font-bold text-accent">+50 XP</span>
                        </div>
                        {score === 100 && (
                          <div className="flex justify-between text-sm">
                            <span>Perfect score bonus</span>
                            <span className="font-bold text-accent">+25 XP</span>
                          </div>
                        )}
                      </div>

                      <p className="text-muted-foreground mb-6">You've earned the {module.title} badge!</p>
                      <EducationBadge moduleSlug={module.slug} title={module.title} isEarned={true} tier={module.tier || 'foundation'} size="lg" showLabel />
                    </>
                  ) : (
                    <>
                      <div className="h-16 w-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                        <span className="text-3xl">📚</span>
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Keep Learning!</h2>
                      <p className="text-lg mb-2">You scored {score}%</p>
                      <p className="text-muted-foreground mb-6">You need 80% to pass. Review the material and try again!</p>
                    </>
                  )}
                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" onClick={() => {
                      setShowQuiz(false); setSubmitted(false); setAnswers({});
                      setCurrentQuestionIndex(0);
                      setAnsweredQuestions(new Set());
                    }} className="flex-1">
                      Review Material
                    </Button>
                    <Button onClick={() => navigate("/learn")} className="flex-1">Back to Modules</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default LearnModule;
