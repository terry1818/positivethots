import { useState } from "react";
import { CelebrationModal } from "@/components/education/CelebrationModal";
import { Button } from "@/components/ui/button";

const CelebrationDemo = () => {
  const [demoType, setDemoType] = useState<"level_up" | "streak_milestone" | "badge_earned" | "tier_complete" | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold mb-6">Celebration Demo</h1>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setDemoType("tier_complete")}>Tier Complete 🏆</Button>
        <Button variant="secondary" onClick={() => setDemoType("level_up")}>Level Up ⭐</Button>
        <Button variant="secondary" onClick={() => setDemoType("streak_milestone")}>Streak Milestone 🔥</Button>
        <Button variant="secondary" onClick={() => setDemoType("badge_earned")}>Badge Earned 🏅</Button>
      </div>

      <CelebrationModal
        type={demoType}
        level={5}
        streak={7}
        badgeTitle="Consent & Boundaries"
        tierName="Foundation"
        onClose={() => setDemoType(null)}
      />
    </div>
  );
};

export default CelebrationDemo;
