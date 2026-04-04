import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, Edit3, Send, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface SafetyNudgeProps {
  message: string;
  onEditMessage: () => void;
  onSendAnyway: () => void;
  onDismiss: () => void;
}

interface NudgeResult {
  classification: string;
  explanation: string;
  suggested_rewrite: string;
  education_link?: string;
}

export const SafetyNudge = ({ message, onEditMessage, onSendAnyway, onDismiss }: SafetyNudgeProps) => {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "mx-3 mb-2 p-3 rounded-xl border border-amber-500/50 bg-amber-950/20",
        !reducedMotion && "animate-in slide-in-from-bottom-2 duration-200"
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <span className="text-lg shrink-0">🤔</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-200">
            This message might come across differently than intended
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            We're not blocking you — just a friendly nudge to reconsider.
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onDismiss} aria-label="Dismiss nudge">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2 mt-3">
        <Button variant="outline" size="sm" className="flex-1" onClick={onEditMessage}>
          <Edit3 className="h-3 w-3 mr-1" /> Edit
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground" onClick={onSendAnyway}>
          <Send className="h-3 w-3 mr-1" /> Send Anyway
        </Button>
      </div>
    </div>
  );
};

// Hook for safety nudge logic with debouncing
export const useSafetyNudge = (enabled: boolean = true) => {
  const [nudge, setNudge] = useState<NudgeResult | null>(null);
  const [checking, setChecking] = useState(false);
  const lastChecked = useRef<string>("");
  const debounceTimer = useRef<NodeJS.Timeout>();
  const cache = useRef<Map<string, NudgeResult | null>>(new Map());

  const checkMessage = useCallback(async (content: string) => {
    if (!enabled || !content.trim() || content.length < 10) {
      setNudge(null);
      return;
    }

    // Cache check
    if (cache.current.has(content)) {
      setNudge(cache.current.get(content) || null);
      return;
    }

    if (content === lastChecked.current) return;
    lastChecked.current = content;

    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-message-safety", {
        body: { content },
      });
      if (error) throw error;

      const result = data?.classification === "safe" ? null : data as NudgeResult;
      cache.current.set(content, result);
      setNudge(result);
    } catch {
      // Fail open — don't block
      setNudge(null);
    } finally {
      setChecking(false);
    }
  }, [enabled]);

  const debouncedCheck = useCallback((content: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => checkMessage(content), 2000);
  }, [checkMessage]);

  const clearNudge = useCallback(() => setNudge(null), []);

  return { nudge, checking, debouncedCheck, clearNudge };
};
