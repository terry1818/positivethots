import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cookie } from "lucide-react";

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-slide-up">
      <Card className="max-w-lg mx-auto p-4 shadow-lg border bg-card">
        <div className="flex items-start gap-3">
          <Cookie className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-3">
              We use essential cookies to keep you signed in and functional cookies to improve your experience. 
              See our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> for details.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={accept}>Accept</Button>
              <Button size="sm" variant="outline" onClick={decline}>Decline Non-Essential</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
