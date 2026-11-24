import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, BarChart3 } from "lucide-react";
import { learnSection, LEARN_SECTIONS, SECTION_IDS } from "@/lib/learnSections";

const MODULE_OBJECTIVES: Record<string, string[]> = {
  "consent-fundamentals": [
    "Understand enthusiastic consent models (FRIES framework)",
    "Practice boundary-setting communication",
    "Recognize consent violations and how to respond",
    "Apply ongoing negotiation in relationships",
  ],
  "boundaries-communication": [
    "Use Nonviolent Communication (NVC) techniques",
    "Set and maintain healthy boundaries",
    "Navigate difficult conversations with empathy",
    "Practice active listening and reflection",
  ],
  "safer-sex": [
    "Understand STI prevention and testing protocols",
    "Discuss safer sex practices with partners",
    "Know your rights regarding sexual health",
    "Create a personal safer sex agreement",
  ],
  "understanding-desire": [
    "Distinguish responsive vs. spontaneous desire",
    "Apply the Dual Control Model of arousal",
    "Communicate desire differences with partners",
    "Understand how stress and context affect desire",
  ],
  "emotional-responsibility": [
    "Practice emotional self-regulation techniques",
    "Identify and manage attachment triggers",
    "Take accountability without defensiveness",
    "Build emotional intelligence in relationships",
  ],
};

interface WhatYoullLearnProps {
  moduleSlug: string;
  tier: string;
  estimatedMinutes?: number | null;
}

export const WhatYoullLearn = ({ moduleSlug, tier, estimatedMinutes }: WhatYoullLearnProps) => {
  const objectives = MODULE_OBJECTIVES[moduleSlug];
  if (!objectives) return null;

  const framework = learnSection(tier).sources;
  const tierColor = learnSection(tier).chip;
  const difficulty = learnSection(tier).level;

  return (
    <Card className="mb-6 border-border/50">
      <CardContent className="p-4 space-y-4">
        <h3 className="font-semibold text-foreground">What You'll Learn</h3>

        <div className="space-y-2">
          {objectives.map((obj, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span className="text-sm text-muted-foreground">{obj}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={`text-sm ${tierColor}`}>
            <BarChart3 className="h-3 w-3 mr-1" />
            {difficulty}
          </Badge>
          {estimatedMinutes && (
            <Badge variant="outline" className="text-sm">
              <Clock className="h-3 w-3 mr-1" />
              ~{estimatedMinutes} min
            </Badge>
          )}
          <Badge variant="outline" className="text-sm text-muted-foreground">
            Based on {framework}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
