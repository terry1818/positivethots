import { SpotlightTour, type TourStep } from "@/components/SpotlightTour";
import { useTutorialState } from "@/hooks/useTutorialState";

const STEPS: TourStep[] = [
  {
    target: "discovery-card",
    title: "Your first match suggestion!",
    description: "Tap to see their full profile.",
    position: "below",
  },
  {
    target: "compatibility-score",
    title: "Compatibility Score",
    description: "This shows how compatible you are based on shared values and education progress.",
    position: "below",
  },
  {
    target: "action-buttons",
    title: "Pass, Connect, or Send a Thot",
    description: "Pass, Connect, or Send a Thot — a special way to stand out!",
    position: "above",
  },
  {
    target: "bottom-nav",
    title: "Explore the app",
    description: "Check your Likes, Learn modules, Messages, and Profile here. Have fun! 💜",
    position: "above",
  },
];

interface DiscoveryWalkthroughProps {
  onComplete: () => void;
}

export const DiscoveryWalkthrough = ({ onComplete }: DiscoveryWalkthroughProps) => {
  const { markSeen } = useTutorialState("discovery_walkthrough");

  return (
    <SpotlightTour
      tourKey="discovery_walkthrough"
      steps={STEPS}
      onComplete={() => {
        markSeen();
        onComplete();
      }}
    />
  );
};

/**
 * Check if walkthrough should show. Now relies on the tutorials_completed
 * field in the profiles table (via useTutorialState), so this function
 * just returns true — the actual gating is done by useTutorialState.seen.
 */
export const shouldShowWalkthrough = (): boolean => {
  return true; // Let useTutorialState handle the check
};
