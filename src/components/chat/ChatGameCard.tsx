import { memo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Gamepad2, Check, ArrowRight, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface GameState {
  questions: { id: string; text: string; options?: string[] }[];
  currentIndex: number;
  answers: Record<string, Record<string, string | number>>; // { visitorUserId: { questionId: answer } }
  completed: boolean;
  truthResponder?: string; // for truth_prompt: who's answering
  truthResponse?: string;
}

interface ChatGameCardProps {
  game: {
    id: string;
    game_type: string;
    game_state: GameState;
    created_by: string;
    created_at: string;
  };
  currentUserId: string;
  otherUserName: string;
  matchId: string;
}

const GAME_LABELS: Record<string, { label: string; emoji: string }> = {
  would_you_rather: { label: "Would You Rather", emoji: "🤔" },
  compatibility_quiz: { label: "Compatibility Quiz", emoji: "💜" },
  truth_prompt: { label: "Truth Prompt", emoji: "💭" },
};

export const ChatGameCard = memo(({ game, currentUserId, otherUserName, matchId }: ChatGameCardProps) => {
  const { playBadgeUnlock } = useSoundEffects();
  const [localState, setLocalState] = useState<GameState>(game.game_state);
  const [submitting, setSubmitting] = useState(false);
  const [truthInput, setTruthInput] = useState("");

  useEffect(() => {
    setLocalState(game.game_state);
  }, [game.game_state]);

  const gameInfo = GAME_LABELS[game.game_type] || { label: "Game", emoji: "🎮" };
  const currentQ = localState.questions?.[localState.currentIndex];
  const myAnswers = localState.answers?.[currentUserId] || {};
  const otherUserId = Object.keys(localState.answers || {}).find(k => k !== currentUserId);
  const otherAnswers = otherUserId ? localState.answers[otherUserId] || {} : {};

  const updateGameState = async (newState: GameState) => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("chat_games" as any)
        .update({ game_state: newState as any })
        .eq("id", game.id);
      if (error) throw error;
      setLocalState(newState);
    } catch (e) {
      toast.error("Failed to update game");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = async (answer: string | number) => {
    if (!currentQ || submitting) return;
    const newAnswers = {
      ...localState.answers,
      [currentUserId]: { ...myAnswers, [currentQ.id]: answer },
    };

    const bothAnswered = otherUserId && otherAnswers[currentQ.id] !== undefined;
    const isLast = localState.currentIndex >= localState.questions.length - 1;

    const newState: GameState = {
      ...localState,
      answers: newAnswers,
      currentIndex: bothAnswered && !isLast ? localState.currentIndex + 1 : localState.currentIndex,
      completed: bothAnswered && isLast,
    };

    if (newState.completed) playBadgeUnlock();
    await updateGameState(newState);
  };

  const handleTruthSubmit = async () => {
    if (!truthInput.trim() || submitting) return;
    const newState: GameState = {
      ...localState,
      truthResponse: truthInput.trim(),
      completed: true,
    };
    playBadgeUnlock();
    await updateGameState(newState);
  };

  // --- RENDER ---

  // Completed state
  if (localState.completed) {
    return (
      <Card className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 max-w-sm mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{gameInfo.emoji}</span>
          <span className="font-semibold text-sm">{gameInfo.label}</span>
          <Badge variant="secondary" className="text-sm ml-auto">Complete ✓</Badge>
        </div>

        {game.game_type === "truth_prompt" ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{currentQ?.text}</p>
            <div className="bg-background/60 rounded-lg p-3 border border-border/50">
              <p className="text-sm italic">"{localState.truthResponse}"</p>
              <p className="text-sm text-muted-foreground mt-1">
                — {localState.truthResponder === currentUserId ? "You" : otherUserName}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {localState.questions.map((q, i) => {
              const myAns = myAnswers[q.id];
              const theirAns = otherAnswers[q.id];
              const match = myAns === theirAns;
              return (
                <div key={q.id} className="text-sm space-y-1">
                  <p className="font-medium text-foreground">{q.text}</p>
                  <div className="flex gap-2">
                    <Badge variant={match ? "default" : "secondary"} className="text-sm">
                      You: {typeof myAns === "number" ? q.options?.[myAns] : myAns}
                    </Badge>
                    <Badge variant={match ? "default" : "outline"} className="text-sm">
                      {otherUserName}: {typeof theirAns === "number" ? q.options?.[theirAns] : theirAns}
                    </Badge>
                  </div>
                  {match && <span className="text-sm text-primary">🎉 Match!</span>}
                </div>
              );
            })}
            {game.game_type === "compatibility_quiz" && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-sm font-bold text-center">
                  {Object.keys(myAnswers).filter(qId => myAnswers[qId] === otherAnswers[qId]).length}
                  /{localState.questions.length} matched! 
                  {Object.keys(myAnswers).filter(qId => myAnswers[qId] === otherAnswers[qId]).length >= 4 ? " 🔥" : " 💜"}
                </p>
              </div>
            )}
          </div>
        )}
      </Card>
    );
  }

  // Truth prompt - active
  if (game.game_type === "truth_prompt" && currentQ) {
    const isResponder = localState.truthResponder === currentUserId;
    return (
      <Card className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 max-w-sm mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{gameInfo.emoji}</span>
          <span className="font-semibold text-sm">{gameInfo.label}</span>
        </div>
        <p className="text-sm font-medium mb-3">{currentQ.text}</p>
        {isResponder ? (
          <div className="space-y-2">
            <textarea
              value={truthInput}
              onChange={(e) => setTruthInput(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full text-sm bg-background/60 border border-border/50 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              rows={3}
              maxLength={500}
            />
            <Button size="sm" onClick={handleTruthSubmit} disabled={!truthInput.trim() || submitting} className="w-full">
              <MessageCircle className="h-3.5 w-3.5 mr-1" /> Share Answer
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Waiting for {otherUserName} to answer...</p>
        )}
      </Card>
    );
  }

  // WYR / Quiz - active question
  if (!currentQ) return null;

  const iAlreadyAnswered = myAnswers[currentQ.id] !== undefined;
  const theyAlreadyAnswered = otherAnswers[currentQ.id] !== undefined;

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 max-w-sm mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{gameInfo.emoji}</span>
        <span className="font-semibold text-sm">{gameInfo.label}</span>
        <span className="text-sm text-muted-foreground ml-auto">
          {localState.currentIndex + 1}/{localState.questions.length}
        </span>
      </div>
      <p className="text-sm font-medium mb-3">{currentQ.text}</p>

      {iAlreadyAnswered ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Check className="h-3 w-3 text-primary" /> You answered! Waiting for {otherUserName}...
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {currentQ.options?.map((opt, idx) => (
            <Button
              key={idx}
              variant="outline"
              className="w-full justify-start text-left text-sm h-auto py-2.5 hover:bg-primary/10 hover:border-primary/40"
              onClick={() => handleAnswer(idx)}
              disabled={submitting}
            >
              {opt}
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
});

ChatGameCard.displayName = "ChatGameCard";
