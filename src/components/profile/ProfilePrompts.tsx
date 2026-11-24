import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, MessageSquarePlus } from "lucide-react";

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
    staleTime: 10 * 60 * 1000, // 10 min — profile data
  });

  if (prompts.length === 0) {
    if (!isOwnProfile) return null;
    return (
      <button type="button" onClick={onAddPrompts} className="kit-row">
        <span className="kit-coin" data-tone="info"><MessageSquarePlus aria-hidden="true" /></span>
        <span className="flex-1 min-w-0">
          <span className="block font-extrabold leading-snug">Add prompts</span>
          <span className="block text-sm text-muted-foreground">Let people know the real you.</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>
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
