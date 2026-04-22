import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EducationBadge } from "@/components/EducationBadge";
import { X, BookOpen, Shield, Heart } from "lucide-react";
import { BrandTagline } from "@/components/BrandTagline";

const FOUNDATION_BADGES = [
  { slug: "consent-fundamentals", title: "Consent" },
  { slug: "boundaries-communication", title: "Communication" },
  { slug: "safer-sex", title: "Health" },
  { slug: "understanding-desire", title: "Desire" },
  { slug: "emotional-responsibility", title: "Emotional IQ" },
];

const FRAMEWORK_INFO = [
  {
    name: "AASECT",
    description: "American Association of Sexuality Educators, Counselors, and Therapists — the gold standard in sex education accreditation.",
  },
  {
    name: "Sexual Health Alliance",
    description: "Evidence-based sexual health training used by licensed therapists and counselors worldwide.",
  },
  {
    name: "Gottman Method",
    description: "Dr. John Gottman's 40+ years of relationship research — the most data-backed framework for healthy relationships.",
  },
];

interface ValuePropositionScreenProps {
  onBegin: () => void;
}

export const ValuePropositionScreen = ({ onBegin }: ValuePropositionScreenProps) => {
  const [showFrameworks, setShowFrameworks] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4 overflow-y-auto">
      <div className="w-full max-w-md space-y-8 py-8">
        {/* Headline */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mx-auto">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            You're in!
          </h1>
          <BrandTagline variant="secondary" className="mt-2" />
          <p className="text-muted-foreground leading-relaxed">
            Before you meet anyone, you'll learn what most people never do — consent, communication, and emotional intelligence. Built on the same frameworks therapists use with their clients. This is what makes every match on Positive Thots<sup className="text-[0.5em] ml-0.5 align-super">TM</sup> different.
          </p>
        </div>

        {/* Foundation badge icons */}
        <div className="flex justify-center gap-4">
          {FOUNDATION_BADGES.map((badge) => (
            <EducationBadge
              key={badge.slug}
              moduleSlug={badge.slug}
              title={badge.title}
              isEarned={false}
              tier="foundation"
              size="md"
              showLabel
            />
          ))}
        </div>

        {/* Tagline */}
        <p className="text-center text-sm font-semibold text-primary tracking-wide">
          5 courses. 100% required. 0% optional.
        </p>

        {/* CTA */}
        <div className="space-y-3">
          <Button onClick={onBegin} className="w-full text-lg h-12" size="lg">
            Let's Begin
          </Button>
          <button
            type="button"
            onClick={() => setShowFrameworks(true)}
            className="w-full text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
          >
            Learn more about our curriculum
          </button>
        </div>
      </div>

      {/* Framework info modal */}
      {showFrameworks && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-2xl border-primary/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Evidence-Based Curriculum
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowFrameworks(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Every module in Positive Thots<sup className="text-[0.5em] ml-0.5 align-super">TM</sup> is built on peer-reviewed research and professional frameworks:
              </p>
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
