import { useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Star, ExternalLink, MessageCircle, Heart } from "lucide-react";

interface NpsModalProps {
  triggerEvent: string;
  onClose: () => void;
}

type Phase = "score" | "feedback" | "thankyou";

function getScoreColor(score: number, selected: boolean) {
  if (!selected) {
    if (score <= 6) return "border-destructive/40 text-destructive hover:bg-destructive/10";
    if (score <= 8) return "border-yellow-500/40 text-yellow-600 hover:bg-yellow-500/10";
    return "border-primary/40 text-primary hover:bg-primary/10";
  }
  if (score <= 6) return "bg-destructive text-destructive-foreground border-destructive ring-2 ring-destructive/30";
  if (score <= 8) return "bg-yellow-500 text-white border-yellow-500 ring-2 ring-yellow-500/30";
  return "bg-primary text-primary-foreground border-primary ring-2 ring-primary/30";
}

function getCategory(score: number): "promoter" | "passive" | "detractor" {
  if (score >= 9) return "promoter";
  if (score >= 7) return "passive";
  return "detractor";
}

export const NpsModal = ({ triggerEvent, onClose }: NpsModalProps) => {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("score");
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleScoreSelect = useCallback((s: number) => {
    setScore(s);
    setPhase("feedback");
  }, []);

  const handleSubmit = useCallback(async () => {
    if (score === null || !user) return;
    setSubmitting(true);
    await supabase.from("nps_responses" as any).insert({
      user_id: user.id,
      score,
      feedback: feedback.trim() || null,
      trigger_event: triggerEvent,
    } as any);
    setSubmitting(false);
    setPhase("thankyou");
  }, [score, feedback, triggerEvent, user]);

  const category = score !== null ? getCategory(score) : null;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        {phase === "score" && (
          <div className="text-center py-2">
            <Star className="h-8 w-8 mx-auto text-primary mb-3" />
            <h2 className="text-lg font-semibold text-foreground mb-1">
              How likely are you to recommend{" "}
              <span className="text-primary">Positive Thots<sup className="text-[0.5em] ml-0.5 align-super">TM</sup></span> to a friend?
            </h2>
            <p className="text-sm text-muted-foreground mb-5">0 = Not at all likely · 10 = Extremely likely</p>
            <div className="flex gap-1.5 justify-center flex-wrap">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handleScoreSelect(i)}
                  className={cn(
                    "w-9 h-9 rounded-lg border text-sm font-semibold transition-all duration-150",
                    getScoreColor(i, false)
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="text-sm text-muted-foreground mt-5 hover:text-foreground transition-colors">
              Maybe later
            </button>
          </div>
        )}

        {phase === "feedback" && score !== null && (
          <div className="text-center py-2 animate-fade-in">
            <div className="flex gap-1.5 justify-center flex-wrap mb-4">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setScore(i)}
                  className={cn(
                    "w-9 h-9 rounded-lg border text-sm font-semibold transition-all duration-150",
                    getScoreColor(i, i === score)
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
            <Textarea
              placeholder="What's the main reason for your score? (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="mb-4"
              rows={3}
              maxLength={500}
            />
            <Button onClick={handleSubmit} disabled={submitting} className="w-full">
              {submitting ? "Submitting…" : "Submit"}
            </Button>
            <button onClick={onClose} className="text-sm text-muted-foreground mt-3 hover:text-foreground transition-colors">
              Maybe later
            </button>
          </div>
        )}

        {phase === "thankyou" && category === "promoter" && (
          <div className="text-center py-4 animate-fade-in">
            <Heart className="h-10 w-10 mx-auto text-primary mb-3 animate-bounce" />
            <h2 className="text-lg font-semibold mb-2">Thank you! 💜</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Would you mind leaving us a review? It really helps!
            </p>
            <div className="flex gap-2 justify-center">
              <Button size="sm" variant="outline" className="gap-1.5" asChild>
                <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" /> App Store
                </a>
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" asChild>
                <a href="https://play.google.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" /> Play Store
                </a>
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="mt-3">Done</Button>
          </div>
        )}

        {phase === "thankyou" && category === "passive" && (
          <div className="text-center py-4 animate-fade-in">
            <MessageCircle className="h-10 w-10 mx-auto text-yellow-500 mb-3" />
            <h2 className="text-lg font-semibold mb-2">Thanks for your feedback!</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Is there anything specific we could improve? We're always listening.
            </p>
            <Button onClick={onClose}>Done</Button>
          </div>
        )}

        {phase === "thankyou" && category === "detractor" && (
          <div className="text-center py-4 animate-fade-in">
            <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h2 className="text-lg font-semibold mb-2">We hear you.</h2>
            <p className="text-muted-foreground text-sm mb-4">
              We're sorry to hear that. Would you like to tell us more? Our support team is here to help.
            </p>
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <a href="mailto:support@positivethots.com">Contact Support</a>
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="mt-2 block mx-auto">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
