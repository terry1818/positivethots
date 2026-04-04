import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Eye, EyeOff, Trash2, Plus, GripVertical, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Chapter {
  id?: string;
  chapter_type: string;
  title: string;
  content: string;
  display_order: number;
  is_visible: boolean;
  custom_icon: string | null;
}

const DEFAULT_CHAPTERS: Omit<Chapter, 'id'>[] = [
  { chapter_type: 'my_story', title: 'My ENM Journey', content: '', display_order: 0, is_visible: true, custom_icon: '📖' },
  { chapter_type: 'looking_for', title: "What I'm Seeking", content: '', display_order: 1, is_visible: true, custom_icon: '🔍' },
  { chapter_type: 'relationship_style', title: 'How I Love', content: '', display_order: 2, is_visible: true, custom_icon: '💜' },
  { chapter_type: 'deal_breakers', title: 'My Non-Negotiables', content: '', display_order: 3, is_visible: true, custom_icon: '🚫' },
  { chapter_type: 'fun_facts', title: 'The Fun Stuff', content: '', display_order: 4, is_visible: true, custom_icon: '✨' },
  { chapter_type: 'growth_areas', title: "Where I'm Growing", content: '', display_order: 5, is_visible: true, custom_icon: '🌱' },
];

const PROMPTS: Record<string, string[]> = {
  my_story: [
    "How did you discover ethical non-monogamy?",
    "What's your relationship journey been like?",
    "What moment made you realize traditional dating wasn't for you?",
    "Who or what inspired your ENM journey?",
  ],
  looking_for: [
    "What does your ideal relationship constellation look like?",
    "Are you seeking something specific or open to discovery?",
    "What kind of energy do you want from new connections?",
    "Describe your perfect first date with a new connection.",
  ],
  relationship_style: [
    "Do you practice hierarchical or non-hierarchical polyamory?",
    "How do you describe your approach to relationships?",
    "What does a typical week look like in your relationship life?",
    "How do you balance autonomy with togetherness?",
  ],
  deal_breakers: [
    "What boundaries are non-negotiable for you?",
    "What communication style doesn't work for you?",
    "What should someone know before connecting with you?",
    "What's a green flag vs. red flag for you?",
  ],
  fun_facts: [
    "What's something surprising most people don't know about you?",
    "What are your weekend vibes?",
    "What's the most ENM-centric thing in your apartment?",
    "What's your guilty pleasure?",
  ],
  growth_areas: [
    "What education topics are you most curious about?",
    "What's a relationship skill you're actively working on?",
    "What's the hardest lesson ENM has taught you?",
    "What badge are you working toward and why?",
  ],
};

const COMMON_EMOJIS = ['📖', '🔍', '💜', '🚫', '✨', '🌱', '🎵', '🎮', '🏳️‍🌈', '💫', '🌈', '🔥', '💕', '🤝', '🧠', '🎯', '🌍', '☕', '🍷', '🎨'];

export const ChapterEditor = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customIcon, setCustomIcon] = useState('✨');

  const { data: chapters = [], isLoading } = useQuery({
    queryKey: ['profile-chapters', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const { data, error } = await supabase
        .from('profile_chapters' as any)
        .select('*')
        .eq('user_id', session.user.id)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Chapter[];
    },
    enabled: !!session?.user?.id,
  });

  const upsertMutation = useMutation({
    mutationFn: async (chapter: Chapter) => {
      const payload = {
        user_id: session!.user.id,
        chapter_type: chapter.chapter_type,
        title: chapter.title,
        content: chapter.content,
        display_order: chapter.display_order,
        is_visible: chapter.is_visible,
        custom_icon: chapter.custom_icon,
        updated_at: new Date().toISOString(),
      };
      if (chapter.id) {
        const { error } = await supabase.from('profile_chapters' as any).update(payload).eq('id', chapter.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('profile_chapters' as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile-chapters'] }),
    onError: () => toast.error("Failed to save chapter"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('profile_chapters' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-chapters'] });
      toast.success("Chapter removed");
    },
    onError: () => toast.error("Failed to remove chapter"),
  });

  const initDefaults = useCallback(async () => {
    if (!session?.user?.id || chapters.length > 0 || isLoading) return;
    const inserts = DEFAULT_CHAPTERS.map(ch => ({
      ...ch,
      user_id: session.user.id,
    }));
    await supabase.from('profile_chapters' as any).insert(inserts);
    queryClient.invalidateQueries({ queryKey: ['profile-chapters'] });
  }, [session?.user?.id, chapters.length, isLoading, queryClient]);

  useEffect(() => { initDefaults(); }, [initDefaults]);

  const handleAddCustom = async () => {
    if (!customTitle.trim()) return;
    const customCount = chapters.filter(c => c.chapter_type === 'custom').length;
    if (customCount >= 3) {
      toast.error("Maximum 3 custom chapters allowed");
      return;
    }
    await upsertMutation.mutateAsync({
      chapter_type: 'custom',
      title: customTitle.trim(),
      content: '',
      display_order: chapters.length,
      is_visible: true,
      custom_icon: customIcon,
    });
    setCustomModalOpen(false);
    setCustomTitle('');
    setCustomIcon('✨');
    toast.success("Custom chapter added!");
  };

  const handleSaveChapter = (chapter: Chapter) => {
    upsertMutation.mutate(chapter);
  };

  const moveChapter = async (index: number, direction: 'up' | 'down') => {
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= chapters.length) return;
    const updated = [...chapters];
    [updated[index], updated[swapIdx]] = [updated[swapIdx], updated[index]];
    updated.forEach((ch, i) => { ch.display_order = i; });
    await Promise.all(updated.map(ch => upsertMutation.mutateAsync(ch)));
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const filledCount = chapters.filter(c => c.content.trim().length > 0).length;

  return (
    <div className="space-y-3">
      {filledCount < 3 && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-sm">
          <p className="font-medium">Your story is just getting started! 📖</p>
          <p className="text-muted-foreground mt-1">
            Profiles with 4+ chapters get 3× more Connects.{' '}
            <span className="font-medium text-foreground">{filledCount} of {chapters.length} chapters complete</span>
          </p>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(100, (filledCount / Math.max(chapters.length, 1)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {chapters.map((chapter, index) => (
        <ChapterCard
          key={chapter.id || index}
          chapter={chapter}
          index={index}
          total={chapters.length}
          isExpanded={expandedId === (chapter.id || String(index))}
          onToggleExpand={() => setExpandedId(
            expandedId === (chapter.id || String(index)) ? null : (chapter.id || String(index))
          )}
          onSave={handleSaveChapter}
          onDelete={() => chapter.id && deleteMutation.mutate(chapter.id)}
          onMove={(dir) => moveChapter(index, dir)}
        />
      ))}

      <Button
        variant="outline"
        className="w-full min-h-[44px] border-dashed"
        onClick={() => setCustomModalOpen(true)}
        disabled={chapters.filter(c => c.chapter_type === 'custom').length >= 3}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Custom Chapter
      </Button>

      <Dialog open={customModalOpen} onOpenChange={setCustomModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Chapter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {COMMON_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setCustomIcon(emoji)}
                    className={cn(
                      "w-10 h-10 rounded-lg text-lg flex items-center justify-center transition-all",
                      customIcon === emoji ? "bg-primary text-primary-foreground ring-2 ring-primary" : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value.slice(0, 40))}
                placeholder="e.g., My Favorite Adventures"
                maxLength={40}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">{customTitle.length}/40</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCustom} disabled={!customTitle.trim()}>Add Chapter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function ChapterCard({
  chapter, index, total, isExpanded, onToggleExpand, onSave, onDelete, onMove,
}: {
  chapter: Chapter;
  index: number;
  total: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSave: (ch: Chapter) => void;
  onDelete: () => void;
  onMove: (dir: 'up' | 'down') => void;
}) {
  const [title, setTitle] = useState(chapter.title);
  const [content, setContent] = useState(chapter.content);
  const [visible, setVisible] = useState(chapter.is_visible);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptIdx, setPromptIdx] = useState(0);

  const prompts = PROMPTS[chapter.chapter_type] || [];
  const charCount = content.length;

  const handleBlurSave = () => {
    if (title !== chapter.title || content !== chapter.content || visible !== chapter.is_visible) {
      onSave({ ...chapter, title, content, is_visible: visible });
    }
  };

  return (
    <Card className="overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-3 min-h-[52px] text-left"
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
      >
        <span className="text-lg shrink-0">{chapter.custom_icon || '📖'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{title}</p>
          {!isExpanded && content && (
            <p className="text-xs text-muted-foreground truncate">{content.slice(0, 60)}...</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!visible && <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMove('up')} disabled={index === 0} aria-label="Move up">
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMove('down')} disabled={index === total - 1} aria-label="Move down">
              <ChevronDown className="h-4 w-4" />
            </Button>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <Label htmlFor={`vis-${chapter.id}`} className="text-xs text-muted-foreground">
                {visible ? 'Visible' : 'Hidden'}
              </Label>
              <Switch
                id={`vis-${chapter.id}`}
                checked={visible}
                onCheckedChange={(v) => { setVisible(v); onSave({ ...chapter, title, content, is_visible: v }); }}
              />
            </div>
          </div>

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 40))}
            onBlur={handleBlurSave}
            maxLength={40}
            className="text-sm font-medium"
          />

          <div className="relative">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 500))}
              onBlur={handleBlurSave}
              maxLength={500}
              rows={4}
              placeholder={prompts[0] || "Share your thoughts..."}
              className="text-sm pr-10"
            />
            {prompts.length > 0 && (
              <button
                onClick={() => { setShowPrompt(!showPrompt); setPromptIdx(Math.floor(Math.random() * prompts.length)); }}
                className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-muted transition-colors"
                aria-label="Get writing prompt"
              >
                <Lightbulb className="h-4 w-4 text-amber-400" />
              </button>
            )}
          </div>

          {showPrompt && prompts.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm animate-fade-in">
              <p className="text-amber-200 italic">💡 {prompts[promptIdx]}</p>
              <button
                onClick={() => setPromptIdx((promptIdx + 1) % prompts.length)}
                className="text-xs text-amber-400 underline mt-1"
              >
                Try another
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className={cn(
              "text-xs",
              charCount >= 480 ? "text-destructive" : charCount >= 400 ? "text-amber-400" : "text-muted-foreground"
            )}>
              {charCount} / 500
            </span>
            {chapter.chapter_type === 'custom' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive h-8">
                    <Trash2 className="h-3.5 w-3.5 mr-1" />Remove
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove this chapter?</AlertDialogTitle>
                    <AlertDialogDescription>This chapter and its content will be permanently deleted.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">Remove</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
