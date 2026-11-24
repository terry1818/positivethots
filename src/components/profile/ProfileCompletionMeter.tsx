import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, MessageSquare, Shield, BookOpen, User, Sparkles, ChevronRight } from "lucide-react";
import { GuideArt } from "@/components/mascot/GuideArt";
import type { CompletionStep, NudgeAction } from "@/hooks/useProfileCompletion";

const ICON_MAP: Record<string, typeof Camera> = {
  Camera, MessageSquare, Shield, BookOpen, User, Sparkles,
};

interface ProfileCompletionMeterProps {
  percentage: number;
  nudges: NudgeAction[];
  steps?: CompletionStep[];
}

/** Profile completion shown the way Learn shows a level: a filled track, one pip per step, and the next step as the main row. */
export const ProfileCompletionMeter = ({ percentage, nudges, steps = [] }: ProfileCompletionMeterProps) => {
  const [animatedPct, setAnimatedPct] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  if (percentage >= 100) return null;

  const [topNudge, ...rest] = nudges;
  const doneCount = steps.filter(s => s.done).length;
  // Pips read left to right: finished steps first, then the one that is next.
  const pips = [...steps.filter(s => s.done), ...steps.filter(s => !s.done)];
  const go = (nudge: NudgeAction) => navigate(nudge.route, { state: { focusSection: nudge.section } });

  return (
    <section className="kit-card kit-rise p-3.5" aria-label={`Profile ${percentage}% complete`}>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="kit-eyebrow">Your profile</p>
          <p className="text-xl font-extrabold leading-tight text-foreground">
            <span className="tabular-nums">{percentage}%</span> complete
          </p>
          {steps.length > 0 && (
            <p className="text-sm text-muted-foreground">{doneCount} of {steps.length} steps done</p>
          )}
        </div>
        <GuideArt name="guide-encourage" size={76} />
      </div>

      <span className="kit-progress mt-3" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} aria-label="Profile completion">
        <span style={{ width: `${animatedPct}%` }} />
      </span>
      {steps.length > 0 && (
        <div className="kit-pips mt-2" aria-hidden="true">
          {pips.map((step, i) => (
            <i key={step.key} data-done={step.done} data-next={i === doneCount} />
          ))}
        </div>
      )}

      {topNudge && (() => {
        const Icon = ICON_MAP[topNudge.icon] || BookOpen;
        return (
          <button type="button" onClick={() => go(topNudge)} className="kit-row kit-row-next kit-rise mt-4" style={{ "--i": 1 } as CSSProperties}>
            <span className="kit-coin kit-coin-lg" data-tone="area"><Icon aria-hidden="true" /></span>
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-2 text-sm font-bold kit-text">Next up<span className="kit-chip">{topNudge.weight}</span></span>
              <span className="block font-extrabold leading-snug text-foreground">{topNudge.label}</span>
              {topNudge.motivation && (
                <span className="block text-sm text-muted-foreground [text-wrap:pretty]">{topNudge.motivation}</span>
              )}
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 kit-text" aria-hidden="true" />
          </button>
        );
      })()}

      {rest.length > 0 && (
        <div className="mt-2.5 space-y-2.5">
          {rest.map((nudge, i) => {
            const Icon = ICON_MAP[nudge.icon] || BookOpen;
            return (
              <button key={nudge.label} type="button" onClick={() => go(nudge)} className="kit-row kit-rise" style={{ "--i": i + 2 } as CSSProperties}>
                <span className="kit-coin" data-tone="quiet"><Icon aria-hidden="true" /></span>
                <span className="flex-1 min-w-0 font-semibold leading-snug">{nudge.label}</span>
                <span className="kit-chip" data-tone="quiet">{nudge.weight}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
