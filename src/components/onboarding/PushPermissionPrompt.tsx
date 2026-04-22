import { useState } from "react";
import { Bell, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { registerPushNotifications } from "@/lib/capacitor";

interface PushPermissionPromptProps {
  open: boolean;
  onClose: () => void;
  onDecision?: (granted: boolean) => void;
}

/**
 * In-app explainer dialog shown BEFORE the OS push permission prompt.
 *
 * Per privacy spec, this must be displayed once after onboarding and must
 * call out that lock-screen previews are hidden by default. The user can
 * change that any time in Settings → Notifications → "Show notification
 * previews".
 */
export const PushPermissionPrompt = ({ open, onClose, onDecision }: PushPermissionPromptProps) => {
  const [submitting, setSubmitting] = useState(false);

  const handleAllow = async () => {
    setSubmitting(true);
    try {
      const token = await registerPushNotifications();
      onDecision?.(Boolean(token));
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  const handleDecline = () => {
    onDecision?.(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleDecline(); }}>
      <DialogContent>
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Stay in the loop</DialogTitle>
          <DialogDescription className="text-center">
            Positive Thots can send you notifications for new matches, messages, and learning reminders.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span>
              For your privacy, notification previews are hidden on your lock screen by default. You can change this in Settings.
            </span>
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleAllow} disabled={submitting} className="w-full">
            {submitting ? "Requesting..." : "Allow Notifications"}
          </Button>
          <Button variant="ghost" onClick={handleDecline} disabled={submitting} className="w-full">
            Not Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
