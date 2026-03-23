import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mail, CheckCircle } from "lucide-react";

const COOLDOWN_MS = 60_000; // 60 seconds

function getCooldownKey(email: string) {
  return `pw_reset_cooldown_${email.toLowerCase().trim()}`;
}

function getRemainingCooldown(email: string): number {
  const stored = localStorage.getItem(getCooldownKey(email));
  if (!stored) return 0;
  const remaining = parseInt(stored, 10) - Date.now();
  return remaining > 0 ? remaining : 0;
}

function setCooldown(email: string) {
  localStorage.setItem(getCooldownKey(email), String(Date.now() + COOLDOWN_MS));
}

export const ForgotPasswordModal = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const startCooldownTimer = useCallback((email: string) => {
    const tick = () => {
      const remaining = getRemainingCooldown(email);
      setCooldownSeconds(Math.ceil(remaining / 1000));
      if (remaining > 0) {
        setTimeout(tick, 1000);
      }
    };
    tick();
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset state when closing
      setSent(false);
      setLoading(false);
      setCooldownSeconds(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Please enter your email address");
      return;
    }

    // Check client-side cooldown
    const remaining = getRemainingCooldown(trimmed);
    if (remaining > 0) {
      setCooldownSeconds(Math.ceil(remaining / 1000));
      startCooldownTimer(trimmed);
      toast.error(`Please wait ${Math.ceil(remaining / 1000)} seconds before requesting another reset.`);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;

      // Set cooldown AFTER successful send
      setCooldown(trimmed);
      startCooldownTimer(trimmed);
      setSent(true);
    } catch (err: any) {
      if (err.message?.includes("rate limit") || err.code === "over_email_send_rate_limit") {
        // If backend rate-limits, set a cooldown too
        setCooldown(trimmed);
        startCooldownTimer(trimmed);
        toast.error("Too many reset attempts. Please wait a minute before trying again.");
      } else {
        toast.error(err.message || "Failed to send reset email");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button type="button" className="text-xs text-primary hover:underline">
          Forgot password?
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{sent ? "Check your email" : "Reset your password"}</DialogTitle>
          <DialogDescription>
            {sent
              ? "If an account exists with that email, you'll receive a reset link shortly."
              : "Enter your email and we'll send you a link to reset your password."}
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="rounded-full bg-primary/10 p-3">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Check your inbox (and spam folder) for{" "}
              <span className="font-medium text-foreground">{email.trim()}</span>
            </p>
            {cooldownSeconds > 0 ? (
              <p className="text-xs text-muted-foreground">
                You can request another reset in {cooldownSeconds}s
              </p>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSent(false)}
              >
                Didn't receive it? Try again
              </Button>
            )}
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={255}
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || cooldownSeconds > 0}
            >
              {loading
                ? "Sending..."
                : cooldownSeconds > 0
                ? `Wait ${cooldownSeconds}s`
                : "Send Reset Link"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
