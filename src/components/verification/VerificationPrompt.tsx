import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, X } from "lucide-react";
import { FaceVerificationFlow } from "./FaceVerificationFlow";

interface VerificationPromptProps {
  isVerified: boolean;
}

export const VerificationPrompt = ({ isVerified }: VerificationPromptProps) => {
  const [dismissed, setDismissed] = useState(false);
  const [showFlow, setShowFlow] = useState(false);

  if (isVerified || dismissed) return null;

  return (
    <>
      <Card className="border-primary/30">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Verified profiles get 40% more Connects!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                It takes 30 seconds to verify your identity
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setDismissed(true)} aria-label="Dismiss">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Button size="sm" className="w-full mt-3" onClick={() => setShowFlow(true)}>
            Verify Now
          </Button>
        </CardContent>
      </Card>

      <FaceVerificationFlow open={showFlow} onOpenChange={setShowFlow} />
    </>
  );
};
