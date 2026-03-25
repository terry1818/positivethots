import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Pencil } from "lucide-react";

interface ReflectionPromptProps {
  sectionId: string;
  userId: string;
  prompt: string;
  onSaveAndContinue: () => void;
  onSkip: () => void;
}

export const ReflectionPrompt = ({
  sectionId,
  userId,
  prompt,
  onSaveAndContinue,
  onSkip,
}: ReflectionPromptProps) => {
  const [response, setResponse] = useState("");
  const [existingId, setExistingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("user_reflections")
        .select("id, response_text")
        .eq("user_id", userId)
        .eq("section_id", sectionId)
        .maybeSingle();
      if (data) {
        setResponse(data.response_text);
        setExistingId(data.id);
      }
      setLoaded(true);
    };
    load();
  }, [sectionId, userId]);

  if (!loaded) return null;

  const hasSaved = !!existingId;
  const canSubmit = response.trim().length >= 20;

  const handleSave = async () => {
    setSaving(true);
    try {
      if (existingId) {
        await supabase
          .from("user_reflections")
          .update({ response_text: response })
          .eq("id", existingId);
      } else {
        await supabase
          .from("user_reflections")
          .insert({ user_id: userId, section_id: sectionId, response_text: response });
      }
      onSaveAndContinue();
    } catch (e) {
      console.error("Failed to save reflection:", e);
    } finally {
      setSaving(false);
    }
  };

  // Already saved and not editing — show read-only view
  if (hasSaved && !isEditing) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-primary" /> Your Reflection
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-xs gap-1"
          >
            <Pencil className="h-3 w-3" /> Edit
          </Button>
        </div>
        <p className="text-sm text-muted-foreground italic">"{response}"</p>
        <p className="text-xs text-muted-foreground">
          Your reflections are private and saved to your Learning Journal.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
      <p className="text-sm font-semibold">Take a moment to reflect 💭</p>
      <p className="text-sm">{prompt}</p>
      <Textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Type your thoughts... (min 20 characters)"
        className="text-sm min-h-[60px] resize-none"
        rows={2}
      />
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={!canSubmit || saving}
          size="sm"
        >
          {saving ? "Saving..." : hasSaved ? "Update & Continue →" : "Save & Continue (+5 XP) →"}
        </Button>
        {!hasSaved && (
          <button
            onClick={onSkip}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Skip reflection
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Your reflections are private and saved to your Learning Journal.
      </p>
    </div>
  );
};
