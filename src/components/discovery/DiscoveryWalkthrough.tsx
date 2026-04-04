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

const STORAGE_KEY = "pt_discovery_walkthrough_seen";

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

export const shouldShowWalkthrough = (): boolean => {
  return !localStorage.getItem(STORAGE_KEY) && !localStorage.getItem("pt_tutorial_discovery_walkthrough");
};
