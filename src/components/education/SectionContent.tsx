import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, PlayCircle, FileText, Image, BookOpen, Sparkles, Award, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SectionContentProps {
  section: {
    id: string;
    section_number: number;
    title: string;
    content_type: string;
    content_text?: string | null;
    content_url?: string | null;
    estimated_minutes: number | null;
  };
  isCompleted: boolean;
  onComplete: () => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
  totalSections: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  order_index: number;
}

const contentTypeIcons: Record<string, React.ReactNode> = {
  article: <FileText className="h-4 w-4" />,
  video: <PlayCircle className="h-4 w-4" />,
  infographic: <Image className="h-4 w-4" />,
  study: <BookOpen className="h-4 w-4" />,
  interactive: <Sparkles className="h-4 w-4" />,
};

const renderMarkdown = (content: string) => {
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
    // Handle YouTube video embeds [youtube:Title](url)
    const youtubeMatch = paragraph.match(/\[youtube:(.*?)\]\((https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/[^\)]+)\)/);
    if (youtubeMatch) {
      const embedUrl = youtubeMatch[2]
        .replace('youtube.com/embed/', 'youtube-nocookie.com/embed/')
        .replace('www.youtube.com/embed/', 'www.youtube-nocookie.com/embed/');
      const separator = embedUrl.includes('?') ? '&' : '?';
      const finalUrl = `${embedUrl}${separator}rel=0`;
      return (
        <div key={i} className="my-4">
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <iframe
              src={finalUrl}
              title={youtubeMatch[1]}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-1 text-center">{youtubeMatch[1]}</p>
        </div>
      );
    }
    // Handle links [text](url)
    const withLinks = paragraph.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-secondary underline hover:text-secondary/80">$1</a>'
    );
    return <p key={i} className="mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: withLinks }} />;
  });
};

export const SectionContent = ({
  section,
  isCompleted,
  onComplete,
  onNext,
  onPrev,
  isFirst,
  isLast,
  totalSections,
}: SectionContentProps) => {
  const [showSectionQuiz, setShowSectionQuiz] = useState(false);
  const [sectionQuestions, setSectionQuestions] = useState<QuizQuestion[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [sectionQuizPassed, setSectionQuizPassed] = useState(false);

  // Reset quiz state when section changes
  useEffect(() => {
    setShowSectionQuiz(false);
    setSectionQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setSectionQuizPassed(false);
  }, [section.id]);

  const loadSectionQuiz = async () => {
    setLoadingQuiz(true);
    try {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("section_id", section.id)
        .order("order_index");

      if (error) throw error;

      const parsed = (data || []).map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      }));

      setSectionQuestions(parsed);
      setShowSectionQuiz(true);
    } catch (error) {
      console.error("Error loading section quiz:", error);
      toast.error("Failed to load section quiz");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSubmitSectionQuiz = () => {
    let correct = 0;
    sectionQuestions.forEach(q => {
      if (quizAnswers[q.id] === q.correct_answer) {
        correct++;
      }
    });

    const scorePercent = Math.round((correct / sectionQuestions.length) * 100);
    setQuizScore(scorePercent);
    setQuizSubmitted(true);

    if (scorePercent >= 80) {
      setSectionQuizPassed(true);
      if (!isCompleted) onComplete();
      toast.success(`Section quiz passed! ${scorePercent}%`);
    } else {
      toast.error(`You scored ${scorePercent}%. Need 80% to pass.`);
    }
  };

  const handleRetryQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  // Section quiz view
  if (showSectionQuiz) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span>Section {section.section_number} Quiz</span>
          <span>•</span>
          <span>{sectionQuestions.length} questions</span>
          <span>•</span>
          <span>80% to pass</span>
        </div>

        <h2 className="text-xl font-bold">Quiz: {section.title}</h2>

        {sectionQuestions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No quiz questions available for this section yet.</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowSectionQuiz(false)}>
                Back to Content
              </Button>
            </CardContent>
          </Card>
        ) : !quizSubmitted ? (
          <>
            {sectionQuestions.map((question, qIndex) => (
              <Card key={question.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {qIndex + 1}. {question.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={quizAnswers[question.id]?.toString()}
                    onValueChange={(value) =>
                      setQuizAnswers(prev => ({ ...prev, [question.id]: parseInt(value) }))
                    }
                  >
                    {question.options.map((option: string, oIndex: number) => (
                      <div key={oIndex} className="flex items-center space-x-2 py-2">
                        <RadioGroupItem
                          value={oIndex.toString()}
                          id={`sq-${question.id}-${oIndex}`}
                        />
                        <Label
                          htmlFor={`sq-${question.id}-${oIndex}`}
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
                onClick={() => setShowSectionQuiz(false)}
                className="flex-1"
              >
                Back to Content
              </Button>
              <Button
                onClick={handleSubmitSectionQuiz}
                disabled={Object.keys(quizAnswers).length !== sectionQuestions.length}
                className="flex-1"
              >
                Submit Answers
              </Button>
            </div>
          </>
        ) : (
          <Card className={quizScore >= 80 ? "border-success" : "border-destructive"}>
            <CardContent className="pt-6 text-center">
              {quizScore >= 80 ? (
                <>
                  <Award className="h-16 w-16 mx-auto text-success mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Section Complete! 🎉</h2>
                  <p className="text-lg mb-2">You scored {quizScore}%</p>
                  <p className="text-muted-foreground mb-6">
                    Great job on "{section.title}"!
                  </p>
                </>
              ) : (
                <>
                  <div className="h-16 w-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl">📚</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Keep Studying!</h2>
                  <p className="text-lg mb-2">You scored {quizScore}%</p>
                  <p className="text-muted-foreground mb-6">
                    You need 80% to pass. Review the section material and try again.
                  </p>
                </>
              )}
              <div className="flex gap-3 mt-6">
                {quizScore >= 80 ? (
                  <Button onClick={onNext} className="flex-1">
                    {isLast ? "Take Module Quiz" : "Next Section"}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowSectionQuiz(false);
                        setQuizSubmitted(false);
                        setQuizAnswers({});
                      }}
                      className="flex-1"
                    >
                      Review Material
                    </Button>
                    <Button onClick={handleRetryQuiz} className="flex-1">
                      Retry Quiz
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {contentTypeIcons[section.content_type] || contentTypeIcons.article}
        <span className="capitalize">{section.content_type}</span>
        <span>•</span>
        <span>Section {section.section_number} of {totalSections}</span>
        {section.estimated_minutes && (
          <>
            <span>•</span>
            <span>{section.estimated_minutes} min</span>
          </>
        )}
        {isCompleted && <CheckCircle className="h-4 w-4 text-success ml-auto" />}
      </div>

      <h2 className="text-xl font-bold">{section.title}</h2>

      {/* Video content */}
      {section.content_type === 'video' && section.content_url && (() => {
        const videoUrl = section.content_url!
          .replace('youtube.com/embed/', 'youtube-nocookie.com/embed/')
          .replace('www.youtube.com/embed/', 'www.youtube-nocookie.com/embed/');
        const sep = videoUrl.includes('?') ? '&' : '?';
        const finalVideoUrl = `${videoUrl}${sep}rel=0`;
        return (
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <iframe
              src={finalVideoUrl}
              title={section.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        );
      })()}

      {/* Infographic */}
      {section.content_type === 'infographic' && section.content_url && (
        <div className="rounded-lg overflow-hidden bg-muted">
          <img src={section.content_url} alt={section.title} className="w-full" />
        </div>
      )}

      {/* Text content */}
      {section.content_text && (
        <div className="prose prose-sm max-w-none">
          {renderMarkdown(section.content_text)}
        </div>
      )}

      {/* Interactive placeholder */}
      {section.content_type === 'interactive' && !section.content_text && (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Interactive content coming soon</p>
          </CardContent>
        </Card>
      )}

      {/* Navigation - now requires section quiz */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onPrev}
          disabled={isFirst}
          className="flex-1"
        >
          Previous
        </Button>
        {isCompleted || sectionQuizPassed ? (
          <Button onClick={onNext} className="flex-1">
            {isLast ? "Take Module Quiz" : "Next Section"}
          </Button>
        ) : (
          <Button
            onClick={loadSectionQuiz}
            disabled={loadingQuiz}
            className="flex-1"
          >
            {loadingQuiz ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading Quiz...
              </>
            ) : (
              "Take Section Quiz"
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
