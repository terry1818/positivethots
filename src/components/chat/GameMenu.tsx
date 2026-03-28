import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Gamepad2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GameMenuProps {
  matchId: string;
  currentUserId: string;
  otherUserId: string;
}

const GAMES = [
  { type: "would_you_rather", label: "Would You Rather", emoji: "🤔", count: 3 },
  { type: "compatibility_quiz", label: "Compatibility Quiz", emoji: "💜", count: 5 },
  { type: "truth_prompt", label: "Truth Prompt", emoji: "💭", count: 1 },
];

export const GameMenu = memo(({ matchId, currentUserId, otherUserId }: GameMenuProps) => {
  const [starting, setStarting] = useState(false);

  const startGame = async (gameType: string, questionCount: number) => {
    if (starting) return;
    setStarting(true);

    try {
      // Fetch random questions
      const { data: questions, error } = await supabase
        .from("game_questions" as any)
        .select("id, question_text, options")
        .eq("game_type", gameType)
        .limit(50);

      if (error) throw error;
      if (!questions || questions.length === 0) {
        toast.error("No questions available");
        return;
      }

      // Shuffle and pick
      const shuffled = (questions as any[]).sort(() => Math.random() - 0.5).slice(0, questionCount);

      const gameState: any = {
        questions: shuffled.map((q: any) => ({
          id: q.id,
          text: q.question_text,
          options: q.options || undefined,
        })),
        currentIndex: 0,
        answers: {},
        completed: false,
      };

      // For truth prompt, randomly pick who answers
      if (gameType === "truth_prompt") {
        gameState.truthResponder = Math.random() > 0.5 ? currentUserId : otherUserId;
      }

      const { error: insertError } = await supabase
        .from("chat_games" as any)
        .insert({
          match_id: matchId,
          game_type: gameType,
          game_state: gameState,
          created_by: currentUserId,
        });

      if (insertError) throw insertError;
      toast.success("Game started! 🎮");
    } catch (e: any) {
      toast.error("Failed to start game");
      console.error(e);
    } finally {
      setStarting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Play a game" disabled={starting}>
          <Gamepad2 className="h-5 w-5 text-primary" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">🎮 Play a Game</div>
        {GAMES.map((g) => (
          <DropdownMenuItem key={g.type} onClick={() => startGame(g.type, g.count)} disabled={starting}>
            <span className="mr-2">{g.emoji}</span>
            {g.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

GameMenu.displayName = "GameMenu";
