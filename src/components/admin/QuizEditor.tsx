 import { useState } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
 import { Edit, Save, Plus, Trash2, HelpCircle } from "lucide-react";
 import { toast } from "sonner";
 
interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer?: number;
  order_index: number;
}
 
 interface QuizEditorProps {
   moduleId: string;
   questions: Question[];
   onUpdate: () => void;
 }
 
 export const QuizEditor = ({ moduleId, questions, onUpdate }: QuizEditorProps) => {
   const [isOpen, setIsOpen] = useState(false);
   const [editingQuestions, setEditingQuestions] = useState<Question[]>(questions);
   const [saving, setSaving] = useState(false);
 
   const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
     setEditingQuestions(prev => {
       const updated = [...prev];
       updated[index] = { ...updated[index], [field]: value };
       return updated;
     });
   };
 
   const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
     setEditingQuestions(prev => {
       const updated = [...prev];
       const newOptions = [...updated[questionIndex].options];
       newOptions[optionIndex] = value;
       updated[questionIndex] = { ...updated[questionIndex], options: newOptions };
       return updated;
     });
   };
 
   const addQuestion = () => {
     setEditingQuestions(prev => [
       ...prev,
       {
         id: `new-${Date.now()}`,
         question: "",
         options: ["", "", "", ""],
         correct_answer: 0,
         order_index: prev.length,
       }
     ]);
   };
 
   const removeQuestion = (index: number) => {
     setEditingQuestions(prev => prev.filter((_, i) => i !== index));
   };
 
   const handleSave = async () => {
     setSaving(true);
     try {
       // Validate questions
       for (const q of editingQuestions) {
         if (!q.question.trim()) {
           toast.error("All questions must have text");
           setSaving(false);
           return;
         }
         if (q.options.some(o => !o.trim())) {
           toast.error("All options must have text");
           setSaving(false);
           return;
         }
       }
 
       // Delete removed questions
       const existingIds = questions.map(q => q.id);
       const currentIds = editingQuestions.filter(q => !q.id.startsWith("new-")).map(q => q.id);
       const deletedIds = existingIds.filter(id => !currentIds.includes(id));
 
       if (deletedIds.length > 0) {
         const { error: deleteError } = await supabase
           .from("quiz_questions")
           .delete()
           .in("id", deletedIds);
         if (deleteError) throw deleteError;
       }
 
       // Update existing and insert new
       for (let i = 0; i < editingQuestions.length; i++) {
         const q = editingQuestions[i];
         
         if (q.id.startsWith("new-")) {
           // Insert new question
           const { error } = await supabase
             .from("quiz_questions")
             .insert({
               module_id: moduleId,
               question: q.question,
               options: q.options,
               correct_answer: q.correct_answer,
               order_index: i,
             });
           if (error) throw error;
         } else {
           // Update existing question
           const { error } = await supabase
             .from("quiz_questions")
             .update({
               question: q.question,
               options: q.options,
               correct_answer: q.correct_answer,
               order_index: i,
             })
             .eq("id", q.id);
           if (error) throw error;
         }
       }
 
       toast.success("Quiz updated successfully");
       setIsOpen(false);
       onUpdate();
     } catch (error: any) {
       console.error("Error updating quiz:", error);
       toast.error("Failed to update quiz");
     } finally {
       setSaving(false);
     }
   };
 
   return (
     <Dialog open={isOpen} onOpenChange={(open) => {
       if (open) setEditingQuestions(questions);
       setIsOpen(open);
     }}>
       <DialogTrigger asChild>
         <Button variant="outline" size="sm" className="gap-2">
           <HelpCircle className="h-4 w-4" />
           Edit Quiz
         </Button>
       </DialogTrigger>
       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>Edit Quiz Questions</DialogTitle>
         </DialogHeader>
         
         <div className="space-y-6 py-4">
           {editingQuestions.map((question, qIndex) => (
             <Card key={question.id}>
               <CardHeader className="pb-2">
                 <div className="flex items-center justify-between">
                   <CardTitle className="text-sm">Question {qIndex + 1}</CardTitle>
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => removeQuestion(qIndex)}
                     className="text-destructive"
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </div>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-2">
                   <Label>Question Text</Label>
                   <Input
                     value={question.question}
                     onChange={(e) => handleQuestionChange(qIndex, "question", e.target.value)}
                     placeholder="Enter the question..."
                   />
                 </div>
 
                 <div className="space-y-2">
                   <Label>Options (select the correct answer)</Label>
                   <RadioGroup
                     value={question.correct_answer.toString()}
                     onValueChange={(value) => handleQuestionChange(qIndex, "correct_answer", parseInt(value))}
                   >
                     {question.options.map((option, oIndex) => (
                       <div key={oIndex} className="flex items-center gap-2">
                         <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                         <Input
                           value={option}
                           onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                           placeholder={`Option ${oIndex + 1}`}
                           className="flex-1"
                         />
                       </div>
                     ))}
                   </RadioGroup>
                 </div>
               </CardContent>
             </Card>
           ))}
 
           <Button variant="outline" onClick={addQuestion} className="w-full gap-2">
             <Plus className="h-4 w-4" />
             Add Question
           </Button>
 
           <div className="flex justify-end gap-2">
             <Button variant="outline" onClick={() => setIsOpen(false)}>
               Cancel
             </Button>
             <Button onClick={handleSave} disabled={saving} className="gap-2">
               <Save className="h-4 w-4" />
               {saving ? "Saving..." : "Save Quiz"}
             </Button>
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 };