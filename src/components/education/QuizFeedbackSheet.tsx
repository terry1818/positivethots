import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Info } from "lucide-react";
import { BottomSheet } from "@/components/motion/BottomSheet";
import { GuideArt } from "@/components/mascot/GuideArt";
import { Button } from "@/components/ui/button";
import type { AnswerFeedback } from "@/hooks/useQuizAnswer";
import { choosePraise } from "@/lib/quizMastery";
const correctLines = ["Nice one!", "You've got it!", "Exactly right.", "Beautifully done.", "Spot on!", "That's the one."];
const missedLines = ["Not quite - here's the idea.", "Close. Take a look.", "Good try. Here's the answer."];
export function QuizFeedbackSheet({ feedback, correctOption, onContinue, reread }: {
  feedback: AnswerFeedback | null; correctOption: string; onContinue: () => void; reread?: () => void;
}) {
  const button = useRef<HTMLButtonElement>(null);
  const previous = useRef("");
  const [line, setLine] = useState("");
  useEffect(() => {
    if (!feedback) return;
    const praise = choosePraise(feedback.is_correct ? correctLines : missedLines, previous.current);
    previous.current = praise; setLine(praise);
  }, [feedback]);
  return <BottomSheet open={!!feedback} onOpenChange={() => {}} title={feedback?.is_correct ? "Correct" : "Not quite"}
    tone={feedback?.is_correct ? "success" : "miss"} dismissible={false} initialFocusRef={button}>
    <div className="space-y-4">
      <div aria-live="polite" aria-atomic="true" className="space-y-3">
        <div className={feedback?.is_correct ? "quiz-feedback-success flex items-center gap-3" : "quiz-feedback-miss flex items-center gap-3"}>
          {feedback?.is_correct ? <CheckCircle2 aria-hidden /> : <Info aria-hidden />}<GuideArt name={feedback?.is_correct ? "guide-thumbs-up" : "guide-encourage"} size={112} /><p className="font-bold text-lg">{line}</p>
        </div>
        {!feedback?.is_correct && <p><strong>Correct answer:</strong> {correctOption}</p>}
        <p className="text-base leading-relaxed">{feedback?.explanation}</p>
      </div>
      {reread && <Button variant="link" className="min-h-11" onClick={reread}>Reread this lesson</Button>}
      <Button ref={button} className="w-full min-h-[52px]" onClick={onContinue}>{feedback?.is_correct ? "Continue" : "Got it"}</Button>
    </div>
  </BottomSheet>;
}
