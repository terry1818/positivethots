import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AnswerFeedback {
  is_correct: boolean;
  correct_answer: number;
  explanation: string;
}

// Only a submitted answer receives grading feedback; question loading never includes keys.
export function useQuizAnswer() {
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [error, setError] = useState(false);
  const busy = useRef(false);
  const lastAttempt = useRef<{ question: string; selected: number; elapsed: number } | null>(null);

  const check = async (question: string, selected: number, elapsed: number) => {
    if (busy.current) return;
    busy.current = true;
    lastAttempt.current = { question, selected, elapsed };
    setPending(true);
    setError(false);
    try {
      const { data, error: rpcError } = await supabase.rpc("check_quiz_answer", {
        _question_id: question, _selected_answer: selected, _time_taken_ms: elapsed,
      });
      if (rpcError) throw rpcError;
      const result = data as unknown as AnswerFeedback;
      if (!result || typeof result.is_correct !== "boolean" || !Number.isInteger(result.correct_answer)) {
        throw new Error("Invalid answer feedback");
      }
      setFeedback(result);
    } catch {
      setError(true);
    } finally {
      busy.current = false;
      setPending(false);
    }
  };

  return {
    pending, feedback, error, check,
    retry: () => {
      const attempt = lastAttempt.current;
      if (attempt) void check(attempt.question, attempt.selected, attempt.elapsed);
    },
    reset: () => { setFeedback(null); setError(false); lastAttempt.current = null; },
  };
}