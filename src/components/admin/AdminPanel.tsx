import { useAdminRole } from "@/hooks/useAdminRole";
import { ModuleEditor } from "./ModuleEditor";
import { QuizEditor } from "./QuizEditor";
import { ErrorLogsTab } from "./ErrorLogsTab";
import { AnalyticsTab } from "./AnalyticsTab";
import { ModerationTab } from "./ModerationTab";
import { NpsTab } from "./NpsTab";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, BookOpen, AlertTriangle, BarChart3, MessageSquareWarning, Star } from "lucide-react";

interface Module {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  video_url: string | null;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer?: number;
  order_index: number;
}

interface AdminPanelProps {
  module?: Module;
  questions?: Question[];
  onUpdate?: () => void;
  standalone?: boolean;
}

export const AdminPanel = ({ module, questions, onUpdate, standalone }: AdminPanelProps) => {
  const { isAdmin, loading } = useAdminRole();

  if (loading || !isAdmin) return null;

  const defaultTab = standalone ? "analytics" : "content";

  return (
    <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-4 w-4 text-primary" />
        <Badge variant="outline" className="text-primary border-primary">
          Admin Mode
        </Badge>
      </div>
      <Tabs defaultValue={defaultTab}>
        <TabsList className="grid w-full grid-cols-5 h-auto">
          {module && (
            <TabsTrigger value="content" className="text-xs gap-1">
              <BookOpen className="h-3 w-3" />
              Content
            </TabsTrigger>
          )}
          <TabsTrigger value="analytics" className="text-xs gap-1">
            <BarChart3 className="h-3 w-3" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="nps" className="text-xs gap-1">
            <Star className="h-3 w-3" />
            NPS
          </TabsTrigger>
          <TabsTrigger value="errors" className="text-xs gap-1">
            <AlertTriangle className="h-3 w-3" />
            Errors
          </TabsTrigger>
          <TabsTrigger value="moderation" className="text-xs gap-1">
            <MessageSquareWarning className="h-3 w-3" />
            Moderation
          </TabsTrigger>
        </TabsList>
        {module && onUpdate && (
          <TabsContent value="content">
            <div className="flex flex-wrap gap-2 pt-2">
              <ModuleEditor module={module} onUpdate={onUpdate} />
              <QuizEditor moduleId={module.id} questions={questions || []} onUpdate={onUpdate} />
            </div>
          </TabsContent>
        )}
        <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
        <TabsContent value="errors"><ErrorLogsTab /></TabsContent>
        <TabsContent value="moderation"><ModerationTab /></TabsContent>
      </Tabs>
    </div>
  );
};
