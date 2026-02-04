import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { EducationBadge } from "@/components/EducationBadge";
import { ChevronLeft, CheckCircle, Award, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface Module {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  order_index: number;
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

  useEffect(() => {
    loadModule();
  }, [slug]);

  const loadModule = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);

      const { data: moduleData, error: moduleError } = await supabase
        .from("education_modules")
        .select("*")
        .eq("slug", slug)
        .single();

      if (moduleError) throw moduleError;
      setModule(moduleData);

      const [questionsResult, badgeResult] = await Promise.all([
        supabase
          .from("quiz_questions")
          .select("*")
          .eq("module_id", moduleData.id)
          .order("order_index"),
        supabase
          .from("user_badges")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("module_id", moduleData.id)
          .maybeSingle()
      ]);

      if (questionsResult.error) throw questionsResult.error;
      
      // Parse options from JSONB
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

  const handleSubmitQuiz = async () => {
    if (!module || !userId) return;

    // Calculate score
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct_answer) {
        correct++;
      }
    });

    const scorePercent = Math.round((correct / questions.length) * 100);
    setScore(scorePercent);
    setSubmitted(true);

    // Pass threshold is 80%
    if (scorePercent >= 80) {
      try {
        const { error } = await supabase
          .from("user_badges")
          .insert({
            user_id: userId,
            module_id: module.id,
            quiz_score: scorePercent
          });

        if (error && !error.message.includes("duplicate")) throw error;
        
        toast.success("🎉 Badge earned!", {
          description: `You've completed ${module.title}!`
        });
      } catch (error: any) {
        console.error("Error saving badge:", error);
        toast.error("Failed to save your progress");
      }
    }
  };

  const renderContent = (content: string) => {
    // Simple markdown-like rendering
    return content.split('\n\n').map((paragraph, i) => {
      if (paragraph.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-bold mt-6 mb-3">{paragraph.slice(3)}</h2>;
      }
      if (paragraph.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{paragraph.slice(4)}</h3>;
      }
      if (paragraph.startsWith('- ')) {
        const items = paragraph.split('\n').filter(line => line.startsWith('- '));
        return (
          <ul key={i} className="list-disc list-inside space-y-1 mb-4">
            {items.map((item, j) => (
              <li key={j}>{item.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}</li>
            ))}
          </ul>
        );
      }
      return <p key={i} className="mb-4 leading-relaxed">{paragraph}</p>;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!module) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/learn")}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold">{module.title}</h1>
            <p className="text-sm text-muted-foreground">{module.description}</p>
          </div>
          <EducationBadge
            moduleSlug={module.slug}
            title={module.title}
            isEarned={isAlreadyCompleted || (submitted && score >= 80)}
            size="md"
          />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-6">
        {!showQuiz ? (
          <>
            {/* Reading Content */}
            <div className="prose prose-sm max-w-none mb-8">
              {renderContent(module.content)}
            </div>

            {/* Start Quiz Button */}
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-0">
              <CardContent className="pt-6 text-center">
                {isAlreadyCompleted ? (
                  <>
                    <CheckCircle className="h-12 w-12 mx-auto text-success mb-3" />
                    <h3 className="font-semibold mb-2">Already Completed!</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      You've already earned this badge. Want to review the quiz?
                    </p>
                    <Button onClick={() => setShowQuiz(true)} variant="outline">
                      Review Quiz
                    </Button>
                  </>
                ) : (
                  <>
                    <BookOpen className="h-12 w-12 mx-auto text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Ready for the Quiz?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Answer the questions to earn your badge. You need 80% to pass.
                    </p>
                    <Button onClick={() => setShowQuiz(true)}>
                      Take Quiz
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Quiz */}
            {!submitted ? (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">Quiz: {module.title}</h2>
                
                {questions.map((question, qIndex) => (
                  <Card key={question.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        {qIndex + 1}. {question.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={answers[question.id]?.toString()}
                        onValueChange={(value) => 
                          setAnswers(prev => ({ ...prev, [question.id]: parseInt(value) }))
                        }
                      >
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center space-x-2 py-2">
                            <RadioGroupItem 
                              value={oIndex.toString()} 
                              id={`${question.id}-${oIndex}`} 
                            />
                            <Label 
                              htmlFor={`${question.id}-${oIndex}`}
                              className="flex-1 cursor-pointer"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </CardContent>
                  </Card>
                ))}

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowQuiz(false)}
                    className="flex-1"
                  >
                    Back to Reading
                  </Button>
                  <Button 
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(answers).length !== questions.length}
                    className="flex-1"
                  >
                    Submit Answers
                  </Button>
                </div>
              </div>
            ) : (
              // Results
              <Card className={score >= 80 ? "border-success" : "border-destructive"}>
                <CardContent className="pt-6 text-center">
                  {score >= 80 ? (
                    <>
                      <Award className="h-16 w-16 mx-auto text-success mb-4" />
                      <h2 className="text-2xl font-bold mb-2">Congratulations! 🎉</h2>
                      <p className="text-lg mb-2">You scored {score}%</p>
                      <p className="text-muted-foreground mb-6">
                        You've earned the {module.title} badge!
                      </p>
                      <EducationBadge
                        moduleSlug={module.slug}
                        title={module.title}
                        isEarned={true}
                        size="lg"
                        showLabel
                      />
                    </>
                  ) : (
                    <>
                      <div className="h-16 w-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                        <span className="text-3xl">📚</span>
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Keep Learning!</h2>
                      <p className="text-lg mb-2">You scored {score}%</p>
                      <p className="text-muted-foreground mb-6">
                        You need 80% to pass. Review the material and try again!
                      </p>
                    </>
                  )}
                  <div className="flex gap-3 mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowQuiz(false);
                        setSubmitted(false);
                        setAnswers({});
                      }}
                      className="flex-1"
                    >
                      Review Material
                    </Button>
                    <Button 
                      onClick={() => navigate("/learn")}
                      className="flex-1"
                    >
                      Back to Modules
                    </Button>
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