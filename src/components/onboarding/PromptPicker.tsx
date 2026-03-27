import { useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { PROMPT_QUESTIONS } from "@/lib/promptQuestions";

interface PromptAnswer {
  question: string;
  response: string;
}

interface PromptPickerProps {
  answers: PromptAnswer[];
  onChange: (answers: PromptAnswer[]) => void;
}

export const PromptPicker = ({ answers, onChange }: PromptPickerProps) => {
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);

  const getAnswer = (q: string) => answers.find(a => a.question === q)?.response || "";

  const handleResponseChange = (question: string, response: string) => {
    const existing = answers.filter(a => a.question !== question);
    if (response.trim()) {
      onChange([...existing, { question, response: response.slice(0, 150) }]);
    } else {
      onChange(existing);
    }
  };

  const answeredCount = answers.filter(a => a.response.trim()).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {answeredCount}/3 prompts answered {answeredCount < 2 && "(min 2)"}
        </p>
      </div>
      {answeredCount < 3 && (
        <p className="text-xs text-primary/70 italic">
          💡 Profiles with 3 prompts get 2x more connections
        </p>
      )}

      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
        {PROMPT_QUESTIONS.map((question) => {
          const response = getAnswer(question);
          const isAnswered = response.trim().length > 0;
          const isExpanded = expandedPrompt === question;

          return (
            <div
              key={question}
              className={`rounded-xl p-3 transition-all duration-200 ${
                isAnswered
                  ? "bg-muted/60 border-l-4 border-l-primary border border-border"
                  : "bg-muted/30 border border-border/50 hover:border-border"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedPrompt(isExpanded ? null : question)}
                className="w-full flex items-center gap-2 text-left"
              >
                {isAnswered && <Check className="h-4 w-4 text-primary shrink-0" />}
                <span className={`text-sm flex-1 ${isAnswered ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                  {question}
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-2 space-y-1 animate-in slide-in-from-top-2 duration-150">
                  <Textarea
                    value={response}
                    onChange={(e) => handleResponseChange(question, e.target.value)}
                    placeholder="Your answer..."
                    maxLength={150}
                    rows={2}
                    className="text-sm resize-none"
                    autoFocus
                  />
                  <p className="text-[10px] text-muted-foreground text-right">
                    {response.length}/150
                  </p>
                </div>
              )}

              {!isExpanded && isAnswered && (
                <p className="text-xs text-muted-foreground mt-1 ml-6 line-clamp-1">{response}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
