import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildAuthRedirectUrl } from "@/lib/authRedirect";
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

export const ForgotPasswordModal = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSent(false);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: buildAuthRedirectUrl("/reset-password"),
      });
      if (error) throw error;

      setSent(true);
    } catch (err: any) {
      if (err.message?.includes("rate limit") || err.code === "over_email_send_rate_limit") {
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
        <button type="button" className="text-sm text-primary hover:underline">
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
            <p className="text-sm text-muted-foreground text-center">
              Use the most recent reset email only — newer requests invalidate older links.
            </p>
            <Button variant="ghost" size="sm" onClick={() => setSent(false)}>
              Send another reset email
            </Button>
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
