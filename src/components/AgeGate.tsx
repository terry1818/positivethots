import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "pt_age_confirmed_v1";

export const AgeGate = () => {
  const { user, loading } = useAuth();
  const [confirmed, setConfirmed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });
  const [rejected, setRejected] = useState(false);

  // Listen for storage changes across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue === "true") setConfirmed(true);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // If auth is still loading, don't render anything (avoid flash)
  if (loading) return null;

  // Authenticated users skip the gate entirely
  if (user) return null;

  // Already confirmed — don't show
  if (confirmed) return null;

  const handleConfirm = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setConfirmed(true);
  };

  const handleReject = () => {
    setRejected(true);
  };

  const handleClose = () => {
    setRejected(false);
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      <Card className="w-full max-w-md p-6 sm:p-8 shadow-[var(--shadow-elevated)] animate-fade-in">
        <div className="flex justify-center mb-5">
          <Logo size="lg" />
        </div>

        {!rejected ? (
          <>
            <h1 id="age-gate-title" className="text-2xl font-bold text-center mb-3">
              Welcome to Positive Thots<sup className="text-[0.5em] ml-0.5 align-super">TM</sup>
            </h1>
            <p className="text-center text-muted-foreground mb-6 leading-relaxed">
              You must be 18 or older to use this app.
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleConfirm}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 min-h-[48px] text-base"
                size="lg"
              >
                I'm 18 or Older
              </Button>
              <Button
                onClick={handleReject}
                variant="outline"
                className="w-full min-h-[48px] text-base"
                size="lg"
              >
                I'm Under 18
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1 id="age-gate-title" className="text-2xl font-bold text-center mb-3">
              Come back when you're old enough!
            </h1>
            <p className="text-center text-muted-foreground mb-6 leading-relaxed">
              Positive Thots<sup className="text-[0.5em] ml-0.5 align-super">TM</sup> is for adults 18 and older. We'll be here when you're ready.
            </p>
            <Button
              onClick={handleClose}
              variant="outline"
              className="w-full min-h-[48px] text-base"
              size="lg"
            >
              Close
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};
