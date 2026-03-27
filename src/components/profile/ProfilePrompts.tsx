import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProfilePromptsDisplayProps {
  userId: string;
  isOwnProfile?: boolean;
  onAddPrompts?: () => void;
}

export const ProfilePromptsDisplay = ({ userId, isOwnProfile, onAddPrompts }: ProfilePromptsDisplayProps) => {
  const { data: prompts = [] } = useQuery({
    queryKey: ["profile-prompts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_prompts" as any)
        .select("*")
        .eq("user_id", userId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!userId,
  });

  if (prompts.length === 0) {
    if (!isOwnProfile) return null;
    return (
      <div className="bg-muted/30 rounded-xl p-4 text-center">
        <p className="text-sm text-muted-foreground mb-2">Add prompts to let people know the real you</p>
        <button
          onClick={onAddPrompts}
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          + Add prompts
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {prompts.map((prompt: any) => (
        <div key={prompt.id} className="bg-muted/30 rounded-xl p-4">
          <p className="text-sm text-primary font-medium">{prompt.prompt_question}</p>
          <p className="text-base text-foreground mt-1">{prompt.prompt_response}</p>
        </div>
      ))}
    </div>
  );
};
