 import { useState } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Textarea } from "@/components/ui/textarea";
 import { Label } from "@/components/ui/label";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { Edit, Save, X, Plus, Trash2, Link } from "lucide-react";
 import { toast } from "sonner";
 
 interface Module {
   id: string;
   slug: string;
   title: string;
   description: string;
   content: string;
   video_url: string | null;
 }
 
 interface ModuleEditorProps {
   module: Module;
   onUpdate: () => void;
 }
 
 export const ModuleEditor = ({ module, onUpdate }: ModuleEditorProps) => {
   const [isOpen, setIsOpen] = useState(false);
   const [saving, setSaving] = useState(false);
   const [formData, setFormData] = useState({
     title: module.title,
     description: module.description,
     content: module.content,
     video_url: module.video_url || "",
   });
 
   const handleSave = async () => {
     setSaving(true);
     try {
       const { error } = await supabase
         .from("education_modules")
         .update({
           title: formData.title,
           description: formData.description,
           content: formData.content,
           video_url: formData.video_url || null,
         })
         .eq("id", module.id);
 
       if (error) throw error;
 
       toast.success("Module updated successfully");
       setIsOpen(false);
       onUpdate();
     } catch (error: any) {
       console.error("Error updating module:", error);
       toast.error("Failed to update module");
     } finally {
       setSaving(false);
     }
   };
 
   const insertLink = () => {
     const url = prompt("Enter the URL:");
     const text = prompt("Enter the link text:");
     if (url && text) {
       setFormData(prev => ({
         ...prev,
         content: prev.content + `\n[${text}](${url})`
       }));
     }
   };
 
   return (
     <Dialog open={isOpen} onOpenChange={setIsOpen}>
       <DialogTrigger asChild>
         <Button variant="outline" size="sm" className="gap-2">
           <Edit className="h-4 w-4" />
           Edit Module
         </Button>
       </DialogTrigger>
       <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>Edit Module: {module.title}</DialogTitle>
         </DialogHeader>
         
         <div className="space-y-4 py-4">
           <div className="space-y-2">
             <Label htmlFor="title">Title</Label>
             <Input
               id="title"
               value={formData.title}
               onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
             />
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="description">Description</Label>
             <Input
               id="description"
               value={formData.description}
               onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
             />
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="video_url">Video URL (YouTube Embed)</Label>
             <Input
               id="video_url"
               placeholder="https://www.youtube.com/embed/VIDEO_ID"
               value={formData.video_url}
               onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
             />
             <p className="text-xs text-muted-foreground">
               Use YouTube embed URLs (e.g., https://www.youtube.com/embed/xxxxx)
             </p>
           </div>
 
           <div className="space-y-2">
             <div className="flex items-center justify-between">
               <Label htmlFor="content">Content (Markdown)</Label>
               <Button variant="outline" size="sm" onClick={insertLink} className="gap-1">
                 <Link className="h-3 w-3" />
                 Insert Link
               </Button>
             </div>
             <Textarea
               id="content"
               value={formData.content}
               onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
               className="min-h-[300px] font-mono text-sm"
             />
             <p className="text-xs text-muted-foreground">
               Use ## for headings, - for lists, **bold**, and [text](url) for links
             </p>
           </div>
 
           <div className="flex justify-end gap-2">
             <Button variant="outline" onClick={() => setIsOpen(false)}>
               Cancel
             </Button>
             <Button onClick={handleSave} disabled={saving} className="gap-2">
               <Save className="h-4 w-4" />
               {saving ? "Saving..." : "Save Changes"}
             </Button>
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 };