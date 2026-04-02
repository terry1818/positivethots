import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, BarChart3 } from "lucide-react";

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

const TIER_FRAMEWORKS: Record<string, string> = {
  foundation: "AASECT & Sexual Health Alliance",
  sexual_health: "Sexual Health Alliance",
  identity: "AASECT & SHA Frameworks",
  relationships: "Gottman Method & NVC",
  advanced: "SHA Kink-Informed Care",
};

const TIER_COLORS: Record<string, string> = {
  foundation: "bg-primary/10 text-primary border-primary/30",
  sexual_health: "bg-green-500/10 text-green-500 border-green-500/30",
  identity: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  relationships: "bg-pink-500/10 text-pink-500 border-pink-500/30",
  advanced: "bg-accent/10 text-accent border-accent/30",
};

const TIER_LABELS: Record<string, string> = {
  foundation: "Foundation",
  sexual_health: "Intermediate",
  identity: "Intermediate",
  relationships: "Intermediate",
  advanced: "Advanced",
};

interface WhatYoullLearnProps {
  moduleSlug: string;
  tier: string;
  estimatedMinutes?: number | null;
}

export const WhatYoullLearn = ({ moduleSlug, tier, estimatedMinutes }: WhatYoullLearnProps) => {
  const objectives = MODULE_OBJECTIVES[moduleSlug];
  if (!objectives) return null;

  const framework = TIER_FRAMEWORKS[tier] || TIER_FRAMEWORKS.foundation;
  const tierColor = TIER_COLORS[tier] || TIER_COLORS.foundation;
  const difficulty = TIER_LABELS[tier] || "Foundation";

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
          <Badge variant="outline" className={`text-xs ${tierColor}`}>
            <BarChart3 className="h-3 w-3 mr-1" />
            {difficulty}
          </Badge>
          {estimatedMinutes && (
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              ~{estimatedMinutes} min
            </Badge>
          )}
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Based on {framework}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
