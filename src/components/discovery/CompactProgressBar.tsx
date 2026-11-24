import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, CheckCircle } from "lucide-react";
import type { TierUnlock } from "@/hooks/useFeatureUnlocks";
import { learnSection, LEARN_SECTIONS, SECTION_IDS } from "@/lib/learnSections";



const nextStep = (tiers: TierUnlock[]) => {
  // An optional section with nothing to unlock is not the "next" step.
  const nextTier = tiers.find((t) => !t.isComplete && t.features.length > 0) ?? tiers.find((t) => !t.isComplete);
  const nextFeature = nextTier?.features.find((f) => !f.isUnlocked);
  const remaining = nextTier ? nextTier.totalModules - nextTier.earnedModules : 0;
  return { nextTier, nextFeature, remaining };
};

/** One pip per tier: gold when finished, pulsing in the Learn colour when it is the one in progress. */
const TierPips = ({ tiers, className }: { tiers: TierUnlock[]; className?: string }) => {
  const { nextTier } = nextStep(tiers);
  const done = tiers.filter((t) => t.isComplete).length;
  return (
    <span className={`kit-pips ${className ?? ""}`} role="img" aria-label={`${done} of ${tiers.length} tiers complete`}>
      {tiers.map((tier) => (
        <i key={tier.tier} data-done={tier.isComplete} data-next={tier.tier === nextTier?.tier} />
      ))}
    </span>
  );
};

/**
 * Learning progress in one row, for Discover when someone is on the card. It says what the next
 * badge unlocks and how many are left, and opens Learn.
 */
export const LearnProgressStrip = ({ tiers }: { tiers: TierUnlock[] }) => {
  const navigate = useNavigate();
  const { nextTier, nextFeature, remaining } = nextStep(tiers);
  const title = nextTier && nextFeature ? `Next: ${nextFeature.label}` : nextTier ? `Next: ${learnSection(nextTier.tier).shortName} tier` : "Every feature unlocked";

  return (
    <button
      type="button"
      onClick={() => navigate("/learn")}
      className="kit-area-learn kit-row discover-strip"
      aria-label={nextTier ? `${title}. ${remaining} ${remaining === 1 ? "badge" : "badges"} to go. Open Learn.` : "Every feature unlocked. Open Learn."}
    >
      <span className="kit-coin" data-tone={nextTier ? "area" : "correct"}>
        {nextTier ? <BookOpen aria-hidden="true" /> : <CheckCircle aria-hidden="true" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold leading-tight">{title}</span>
        <span className="mt-1.5 flex items-center gap-2">
          <TierPips tiers={tiers} className="flex-1" />
          {nextTier && <span className="kit-text text-xs font-extrabold leading-none tabular-nums">{remaining} to go</span>}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  );
};

interface CompactProgressBarProps {
  tiers: TierUnlock[];
  badgeCount: number;
  connectionCount: number;
}

/** The full learning card: three numbers, the next unlock, and a pip per tier. Opens Learn. */
export const CompactProgressBar = ({ tiers, badgeCount, connectionCount }: CompactProgressBarProps) => {
  const navigate = useNavigate();
  const completedTiers = tiers.filter((t) => t.isComplete).length;
  const { nextTier, nextFeature, remaining } = nextStep(tiers);

  return (
    <button
      type="button"
      onClick={() => navigate("/learn")}
      className="kit-area-learn kit-card block w-full p-3.5 text-left transition-[translate] duration-100 active:translate-y-[3px] motion-reduce:transition-none motion-reduce:active:translate-y-0"
    >
      <div className="grid grid-cols-3 gap-2">
        <Stat value={badgeCount} label="Badges" />
        <Stat value={`${completedTiers}/${tiers.length}`} label="Tiers" />
        <Stat value={connectionCount} label="Connects" />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="kit-coin" data-tone={nextTier ? "area" : "correct"}>
          {nextTier ? <BookOpen aria-hidden="true" /> : <CheckCircle aria-hidden="true" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold leading-tight [text-wrap:balance]">
            {nextTier && nextFeature ? `Next: ${nextFeature.label}` : nextTier ? "Keep learning" : "Every feature unlocked"}
          </span>
          {nextTier && (
            <span className="block text-sm text-muted-foreground">{learnSection(nextTier.tier).shortName} tier</span>
          )}
        </span>
        {nextTier && <span className="kit-chip" data-tone="area">{remaining} to go</span>}
      </div>

      <TierPips tiers={tiers} className="mt-3" />
      <span className="kit-text mt-3 flex items-center justify-center gap-1 text-sm font-extrabold">
        Keep learning <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </button>
  );
};

const Stat = ({ value, label }: { value: string | number; label: string }) => (
  <span className="flex min-w-0 flex-col items-center rounded-2xl bg-muted/60 px-1 py-2">
    <span className="kit-stat-value">{value}</span>
    <span className="kit-stat-label">{label}</span>
  </span>
);
