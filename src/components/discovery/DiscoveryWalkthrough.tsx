import { SpotlightTour, type TourStep } from "@/components/SpotlightTour";
import { useTutorialState } from "@/hooks/useTutorialState";

const STEPS: TourStep[] = [
  {
    target: "discovery-card",
    title: "Here's someone to meet",
    description: "Tap the card to see their full profile.",
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
    description: "Connects, Learn, Chat and your Profile are down here. Have fun! 💜",
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
