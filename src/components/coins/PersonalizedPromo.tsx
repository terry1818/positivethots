import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface PersonalizedPromoProps {
  featureName: string;
  message: string;
  icon?: string;
}

export const PersonalizedPromo = ({ featureName, message, icon = "✨" }: PersonalizedPromoProps) => {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  if (dismissed) return null;

  return (
    <Card className={cn(
      "border-primary/20 bg-primary/5",
      !reducedMotion && "animate-fade-in"
    )}>
      <CardContent className="pt-3 pb-3 pr-10 relative">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/50 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">{icon}</span>
          <div className="flex-1">
            <p className="font-medium text-sm">Unlock {featureName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
            <Button
              size="sm"
              className="mt-2"
              onClick={() => navigate("/premium")}
            >
              <Sparkles className="h-3 w-3 mr-1" /> Upgrade
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
