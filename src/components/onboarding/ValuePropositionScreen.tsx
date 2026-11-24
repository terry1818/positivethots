import { useState } from "react";
import { GuideArt } from "@/components/mascot/GuideArt";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EducationBadge } from "@/components/EducationBadge";
import { X, BookOpen, Shield, Heart } from "lucide-react";
import { BrandTagline } from "@/components/BrandTagline";

// The five Foundation lessons, in the order the path teaches them.
const FOUNDATION_BADGES = [
  { slug: "consent-fundamentals", title: "Consent" },
  { slug: "boundaries-communication", title: "Boundaries" },
  { slug: "digital-consent-boundaries", title: "Digital" },
  { slug: "safer-sex", title: "Health" },
  { slug: "emotional-responsibility", title: "Emotions" },
];

// What the lessons draw on. These are sources, not endorsements: none of these bodies has reviewed or approved the app.
const FRAMEWORK_INFO = [
  { name: "Sexuality education standards", description: "Topics follow what professional sexuality educators are trained to teach, such as the AASECT core knowledge areas." },
  { name: "Published relationship research", description: "Skills like repair, turning toward, and handling conflict come from decades of research, including John Gottman's." },
  { name: "Consent and communication models", description: "Plain tools you can use the same day, such as FRIES for consent and Nonviolent Communication." },
];

interface ValuePropositionScreenProps {
  onBegin: () => void;
}

export const ValuePropositionScreen = ({ onBegin }: ValuePropositionScreenProps) => {
  const [showFrameworks, setShowFrameworks] = useState(false);

  return (
    <div className="kit-area-learn kit-entry fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="kit-entry-column">
        <div className="kit-panel h-[190px]"><div className="pb-2"><GuideArt name="guide-tier-foundation" size={160} /></div></div>
        <div className="mt-5 text-center">
          <h1 className="text-2xl font-extrabold [text-wrap:balance]">You're in!</h1>
          <BrandTagline variant="secondary" className="mt-1" />
          <p className="mt-2 text-muted-foreground [text-wrap:pretty]">
            Before you meet anyone, you'll learn what most of us were never taught: consent, boundaries, and handling big feelings. Five short lessons, then Discover opens.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-x-3 gap-y-2">
          {FOUNDATION_BADGES.map((badge) => (
            <EducationBadge key={badge.slug} moduleSlug={badge.slug} title={badge.title} isEarned={false} tier="foundation" size="md" showLabel />
          ))}
        </div>

        <Button onClick={onBegin} className="kit-cta mt-6 w-full">Start the first lesson</Button>
        <button type="button" onClick={() => setShowFrameworks(true)}
          className="mt-1 min-h-[44px] w-full text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-primary">
          Where the lessons come from
        </button>
      </div>

      {/* Framework info modal */}
      {showFrameworks && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-2xl border-primary/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Where the lessons come from
                </h2>
                <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Close" onClick={() => setShowFrameworks(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground [text-wrap:pretty]">The lessons are written for everyday people and draw on:</p>
              <div className="space-y-3">
                {FRAMEWORK_INFO.map((fw) => (
                  <div key={fw.name} className="rounded-lg border border-border p-3">
                    <p className="font-semibold text-sm text-foreground">{fw.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{fw.description}</p>
                  </div>
                ))}
              </div>
              <Button onClick={() => setShowFrameworks(false)} className="w-full" variant="outline">
                Got it
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
