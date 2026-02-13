import { CheckCircle, PlayCircle, FileText, Image, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

  const handleMarkComplete = () => {
    if (!isCompleted) onComplete();
    onNext();
  };

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
