import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Save, Plus, Trash2, Link, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface Module {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  video_url: string | null;
}

interface Section {
  id: string;
  module_id: string;
  section_number: number;
  title: string;
  content_type: string;
  content_text: string | null;
  content_url: string | null;
  estimated_minutes: number | null;
}

interface ModuleEditorProps {
  module: Module;
  onUpdate: () => void;
}

export const ModuleEditor = ({ module, onUpdate }: ModuleEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const [formData, setFormData] = useState({
    title: module.title,
    description: module.description,
    content: module.content,
    video_url: module.video_url || "",
  });
  const [sections, setSections] = useState<Section[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSections();
    }
  }, [isOpen]);

  const loadSections = async () => {
    setLoadingSections(true);
    try {
      const { data, error } = await supabase
        .from("module_sections")
        .select("*")
        .eq("module_id", module.id)
        .order("section_number");
      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error("Error loading sections:", error);
    } finally {
      setLoadingSections(false);
    }
  };

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

  const addSection = async () => {
    const newNumber = sections.length + 1;
    try {
      const { data, error } = await supabase
        .from("module_sections")
        .insert({
          module_id: module.id,
          section_number: newNumber,
          title: `Section ${newNumber}`,
          content_type: "article",
          content_text: "## Content Coming Soon\n\nThis section will be populated with educational content.",
          estimated_minutes: 5,
        })
        .select()
        .single();

      if (error) throw error;
      setSections(prev => [...prev, data]);
      toast.success("Section added");
    } catch (error: any) {
      console.error("Error adding section:", error);
      toast.error("Failed to add section");
    }
  };

  const updateSection = async (sectionId: string, updates: Partial<Section>) => {
    try {
      const { error } = await supabase
        .from("module_sections")
        .update(updates)
        .eq("id", sectionId);
      if (error) throw error;
      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, ...updates } : s));
    } catch (error: any) {
      console.error("Error updating section:", error);
      toast.error("Failed to update section");
    }
  };

  const deleteSection = async (sectionId: string) => {
    try {
      const { error } = await supabase
        .from("module_sections")
        .delete()
        .eq("id", sectionId);
      if (error) throw error;
      setSections(prev => {
        const filtered = prev.filter(s => s.id !== sectionId);
        // Re-number
        return filtered.map((s, i) => ({ ...s, section_number: i + 1 }));
      });
      toast.success("Section deleted");
    } catch (error: any) {
      console.error("Error deleting section:", error);
      toast.error("Failed to delete section");
    }
  };

  const saveSections = async () => {
    setSaving(true);
    try {
      for (const section of sections) {
        await supabase
          .from("module_sections")
          .update({
            section_number: section.section_number,
            title: section.title,
            content_type: section.content_type,
            content_text: section.content_text,
            content_url: section.content_url,
            estimated_minutes: section.estimated_minutes,
          })
          .eq("id", section.id);
      }
      toast.success("Sections saved");
      onUpdate();
    } catch (error: any) {
      console.error("Error saving sections:", error);
      toast.error("Failed to save sections");
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

  const updateSectionLocal = (id: string, field: string, value: any) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
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
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="content" className="flex-1">Content</TabsTrigger>
            <TabsTrigger value="sections" className="flex-1">Sections</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 py-4">
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
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="sections" className="space-y-4 py-4">
            {loadingSections ? (
              <div className="text-center py-8 text-muted-foreground">Loading sections...</div>
            ) : (
              <>
                {sections.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No sections yet. Add sections to create a multi-part course.</p>
                    <p className="text-xs mt-1">Without sections, the module uses its main content field.</p>
                  </div>
                )}

                {sections.map((section) => (
                  <Card key={section.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          Section {section.section_number}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSection(section.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Title</Label>
                          <Input
                            value={section.title}
                            onChange={(e) => updateSectionLocal(section.id, "title", e.target.value)}
                            placeholder="Section title"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Content Type</Label>
                          <Select
                            value={section.content_type}
                            onValueChange={(v) => updateSectionLocal(section.id, "content_type", v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="article">Article</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="infographic">Infographic</SelectItem>
                              <SelectItem value="study">Case Study</SelectItem>
                              <SelectItem value="interactive">Interactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {(section.content_type === 'video' || section.content_type === 'infographic') && (
                        <div className="space-y-1">
                          <Label className="text-xs">
                            {section.content_type === 'video' ? 'YouTube Embed URL' : 'Image URL'}
                          </Label>
                          <Input
                            value={section.content_url || ""}
                            onChange={(e) => updateSectionLocal(section.id, "content_url", e.target.value)}
                            placeholder={section.content_type === 'video' ? "https://www.youtube.com/embed/..." : "https://..."}
                          />
                        </div>
                      )}

                      {(section.content_type === 'article' || section.content_type === 'study') && (
                        <div className="space-y-1">
                          <Label className="text-xs">Content (Markdown)</Label>
                          <Textarea
                            value={section.content_text || ""}
                            onChange={(e) => updateSectionLocal(section.id, "content_text", e.target.value)}
                            className="min-h-[150px] font-mono text-xs"
                          />
                        </div>
                      )}

                      <div className="space-y-1">
                        <Label className="text-xs">Estimated Minutes</Label>
                        <Input
                          type="number"
                          value={section.estimated_minutes || 5}
                          onChange={(e) => updateSectionLocal(section.id, "estimated_minutes", parseInt(e.target.value) || 5)}
                          className="w-24"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button variant="outline" onClick={addSection} className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Add Section
                </Button>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                  <Button onClick={saveSections} disabled={saving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Sections"}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
