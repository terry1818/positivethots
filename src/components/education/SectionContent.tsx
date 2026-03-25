import { useState } from "react";
import { CheckCircle, CheckCircle2, XCircle, PlayCircle, FileText, Image, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { KeyTakeaway } from "./KeyTakeaway";
import { ReflectionPrompt } from "./ReflectionPrompt";
import { cn } from "@/lib/utils";

interface CheckpointQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation_correct: string;
  explanation_wrong: string;
  position_in_section: number;
}

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
  checkpointQuestions?: CheckpointQuestion[];
  reflectionPrompt?: string | null;
  userId?: string;
  onReflectionSaved?: () => void;
}

const contentTypeIcons: Record<string, React.ReactNode> = {
  article: <FileText className="h-4 w-4" />,
  video: <PlayCircle className="h-4 w-4" />,
  infographic: <Image className="h-4 w-4" />,
  study: <BookOpen className="h-4 w-4" />,
  interactive: <Sparkles className="h-4 w-4" />,
};

// Extract a "key takeaway" from content (first bold sentence or first line of last paragraph)
const extractTakeaway = (content: string): string => {
  const boldMatch = content.match(/\*\*(.{20,120})\*\*/);
  if (boldMatch) return boldMatch[1];
  const paragraphs = content.split('\n\n').filter(p => p.length > 20 && !p.startsWith('#') && !p.startsWith('['));
  const raw = paragraphs[paragraphs.length - 1]?.slice(0, 150) || "";
  return raw.replace(/\*\*/g, '');
};

const renderParagraph = (paragraph: string, i: number) => {
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
};

const renderMarkdown = (content: string, checkpoints?: CheckpointQuestion[]) => {
  const paragraphs = content.split('\n\n');
  const elements: React.ReactNode[] = [];

  paragraphs.forEach((paragraph, i) => {
    elements.push(renderParagraph(paragraph, i));
    // Insert checkpoint questions after matching paragraph index
    if (checkpoints) {
      const matching = checkpoints.filter(q => q.position_in_section === i);
      matching.forEach(q => {
        elements.push(<QuickCheckCard key={`checkpoint-${q.id}`} checkpoint={q} />);
      });
    }
  });

  return elements;
};

// QuickCheck inline card component
const QuickCheckCard = ({ checkpoint }: { checkpoint: CheckpointQuestion }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isAnswered = selected !== null;
  const isCorrect = selected === checkpoint.correct_answer;

  return (
    <div className="my-5 rounded-lg border-2 border-purple-400/40 bg-purple-500/5 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-purple-400">
        Quick Check 🧠
      </p>
      <p className="text-sm font-medium">{checkpoint.question}</p>

      <div className="flex flex-wrap gap-2">
        {checkpoint.options.map((option, idx) => {
          const isThis = selected === idx;
          const isCorrectOption = idx === checkpoint.correct_answer;
          return (
            <button
              key={idx}
              onClick={() => !isAnswered && setSelected(idx)}
              disabled={isAnswered}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                !isAnswered && "border-border hover:border-purple-400 hover:bg-purple-500/10 cursor-pointer",
                isAnswered && isThis && isCorrectOption && "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
                isAnswered && isThis && !isCorrectOption && "border-destructive bg-destructive/10 text-destructive",
                isAnswered && !isThis && isCorrectOption && "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
                isAnswered && !isThis && !isCorrectOption && "opacity-40 border-border"
              )}
            >
              {option}
              {isAnswered && isThis && isCorrectOption && <CheckCircle2 className="inline h-3 w-3 ml-1" />}
              {isAnswered && isThis && !isCorrectOption && <XCircle className="inline h-3 w-3 ml-1" />}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className={cn(
          "rounded-md p-3 text-sm",
          isCorrect ? "bg-green-500/10" : "bg-destructive/10"
        )}>
          <p className="font-medium flex items-center gap-1.5">
            {isCorrect ? (
              <><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Correct!</>
            ) : (
              <><XCircle className="h-3.5 w-3.5 text-destructive" /> Not quite</>
            )}
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            {isCorrect ? checkpoint.explanation_correct : checkpoint.explanation_wrong}
          </p>
        </div>
      )}

      {isAnswered && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissed(true)}
          className="text-xs text-purple-400 hover:text-purple-300"
        >
          Got it! Keep reading →
        </Button>
      )}
    </div>
  );
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
  checkpointQuestions,
  reflectionPrompt,
  userId,
  onReflectionSaved,
}: SectionContentProps) => {
  const [showBanner, setShowBanner] = useState(false);

  const handleMarkComplete = () => {
    if (!isCompleted) {
      onComplete();
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 2500);
    }
    onNext();
  };

  const takeaway = section.content_text ? extractTakeaway(section.content_text) : "";

  return (
    <div className="space-y-6 relative">
      {/* Section complete banner */}
      {showBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-banner-slide">
          <div className="bg-success text-success-foreground px-6 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Section Complete! +10 XP ⚡
          </div>
        </div>
      )}

      {/* Section header */}
      <div className="flex items-center gap-2 text-sm text-foreground/70">
        {contentTypeIcons[section.content_type] || contentTypeIcons.article}
        <span className="capitalize">{section.content_type}</span>
        <span>•</span>
        <span>Section {section.section_number} of {totalSections}</span>
        {section.estimated_minutes && (
          <>
            <span>•</span>
            <span className="bg-muted px-2 py-0.5 rounded-full text-xs">{section.estimated_minutes} min</span>
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

      {/* Text content with inline checkpoint questions */}
      {section.content_text && (
        <div className="prose prose-sm max-w-none">
          {renderMarkdown(section.content_text, checkpointQuestions)}
        </div>
      )}

      {/* Key Takeaway */}
      {takeaway && (
        <KeyTakeaway takeaway={takeaway} sectionTitle={section.title} />
      )}

      {/* Reflection prompt */}
      {reflectionPrompt && userId && !isCompleted && (
        <ReflectionPrompt
          sectionId={section.id}
          userId={userId}
          prompt={reflectionPrompt}
          onSaveAndContinue={() => {
            onReflectionSaved?.();
            handleMarkComplete();
          }}
          onSkip={handleMarkComplete}
        />
      )}

      {/* Show saved reflection if already completed */}
      {reflectionPrompt && userId && isCompleted && (
        <ReflectionPrompt
          sectionId={section.id}
          userId={userId}
          prompt={reflectionPrompt}
          onSaveAndContinue={() => onReflectionSaved?.()}
          onSkip={() => {}}
        />
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

      {/* Navigation */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onPrev}
          disabled={isFirst}
          className="flex-1"
        >
          Previous
        </Button>
        <Button onClick={handleMarkComplete} className="flex-1">
          {isLast ? "Take Module Quiz" : isCompleted ? "Next Section" : "Complete & Continue"}
        </Button>
      </div>
    </div>
  );
};
