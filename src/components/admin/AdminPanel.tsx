 import { useAdminRole } from "@/hooks/useAdminRole";
 import { ModuleEditor } from "./ModuleEditor";
 import { QuizEditor } from "./QuizEditor";
 import { Badge } from "@/components/ui/badge";
 import { Shield } from "lucide-react";
 
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
   correct_answer: number;
   order_index: number;
 }
 
 interface AdminPanelProps {
   module: Module;
   questions: Question[];
   onUpdate: () => void;
 }
 
 export const AdminPanel = ({ module, questions, onUpdate }: AdminPanelProps) => {
   const { isAdmin, loading } = useAdminRole();
 
   if (loading || !isAdmin) return null;
 
   return (
     <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-primary/20">
       <div className="flex items-center gap-2 mb-3">
         <Shield className="h-4 w-4 text-primary" />
         <Badge variant="outline" className="text-primary border-primary">
           Admin Mode
         </Badge>
       </div>
       <div className="flex flex-wrap gap-2">
         <ModuleEditor module={module} onUpdate={onUpdate} />
         <QuizEditor moduleId={module.id} questions={questions} onUpdate={onUpdate} />
       </div>
     </div>
   );
 };