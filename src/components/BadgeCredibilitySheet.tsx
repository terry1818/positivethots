import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, Info } from "lucide-react";
import { EducationBadge } from "@/components/EducationBadge";

const BADGE_DESCRIPTIONS: Record<string, string> = {
  "consent-fundamentals": "Understands enthusiastic consent, boundaries, and ongoing negotiation",
  "boundaries-communication": "Practices clear boundary-setting and nonviolent communication",
  "safer-sex": "Knowledgeable about STI prevention, testing, and safer sex practices",
  "understanding-desire": "Understands responsive vs. spontaneous desire and the dual control model",
  "emotional-responsibility": "Demonstrates emotional intelligence, self-regulation, and accountability",
  "enm-principles": "Understands core ethical non-monogamy principles and communication",
  "sexual-wellness-basics": "Foundational knowledge of sexual health and wellness",
  "pleasure-satisfaction": "Understanding of pleasure, satisfaction, and intimacy",
  "common-sexual-concerns": "Awareness of common sexual health concerns and resources",
  "sexual-orientation-spectrum": "Understanding of sexual orientation diversity",
  "gender-identity-expression": "Knowledge of gender identity and expression",
  "relationship-orientations": "Understanding of diverse relationship structures",
  "intersectionality-intimacy": "Awareness of intersectional factors in intimacy",
  "relationship-skills-foundation": "Core relationship skills and communication patterns",
  "navigating-conflict": "Healthy conflict resolution and repair strategies",
  "jealousy-insecurity": "Managing jealousy, insecurity, and attachment triggers",
  "maintaining-intimacy": "Sustaining emotional and physical intimacy over time",
  "advanced-enm-practices": "Advanced ENM practices including hierarchy and agreements",
  "kink-bdsm-basics": "Risk-aware consensual kink practices and negotiation",
  "relationship-vision": "Building intentional relationship vision and goals",
};

const TIER_LABELS: Record<string, string> = {
  foundation: "Foundation",
  sexual_health: "Sexual Health",
  identity: "Identity & Diversity",
  relationships: "Healthy Relationships",
  advanced: "Advanced Topics",
};

const TIER_COLORS: Record<string, string> = {
  foundation: "bg-primary/10 text-primary border-primary/30",
  sexual_health: "bg-green-500/10 text-green-500 border-green-500/30",
  identity: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  relationships: "bg-pink-500/10 text-pink-500 border-pink-500/30",
  advanced: "bg-accent/10 text-accent border-accent/30",
};

interface BadgeCredibilitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleSlug: string;
  title: string;
  tier?: string;
}

export const BadgeCredibilitySheet = ({
  open,
  onOpenChange,
  moduleSlug,
  title,
  tier = "foundation",
}: BadgeCredibilitySheetProps) => {
  const description = BADGE_DESCRIPTIONS[moduleSlug] || "Demonstrates knowledge in this topic area";
  const tierLabel = TIER_LABELS[tier] || "Foundation";
  const tierColor = TIER_COLORS[tier] || TIER_COLORS.foundation;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl border-t-2 border-primary/20">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-3">
            <EducationBadge moduleSlug={moduleSlug} title={title} isEarned tier={tier} size="lg" />
            <div>
              <p className="text-lg font-bold">{title}</p>
              <Badge variant="outline" className={`text-xs mt-1 ${tierColor}`}>
                {tierLabel}
              </Badge>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">{description}</p>

          <div className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                This badge is based on evidence-based frameworks from AASECT, the Sexual Health Alliance, and Dr. John Gottman's relationship research.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
              <p className="text-xs font-medium text-foreground">Anti-cheat verified ✓</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Small info button to trigger the sheet
interface BadgeInfoButtonProps {
  onClick: () => void;
}

export const BadgeInfoButton = ({ onClick }: BadgeInfoButtonProps) => (
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
    aria-label="Badge info"
  >
    <Info className="h-3 w-3" />
  </button>
);
