import { GuideArt } from "@/components/mascot/GuideArt";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setIsRecovery(true);
        setCheckingLink(false);
      }
    });

    const initializeRecovery = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const searchParams = new URLSearchParams(window.location.search);

        const type = hashParams.get("type") ?? searchParams.get("type");
        const code = searchParams.get("code");
        const accessToken = hashParams.get("access_token");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          setIsRecovery(true);
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }

        if (type === "recovery" || !!accessToken) {
          setIsRecovery(true);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (error: any) {
        toast.error(error.message || "This reset link is invalid or has already been used. Please request a new one.");
      } finally {
        setCheckingLink(false);
      }
    };

    void initializeRecovery();

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated successfully!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password. Please request a new reset link and use the latest email.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingLink) {
    return (
      <div className="kit-area-learn kit-entry" aria-busy="true">
        <div className="kit-entry-column kit-card p-6 text-center">
          <div className="flex justify-center"><Logo size="md" /></div>
          <p className="mt-3 text-muted-foreground">Checking your reset link…</p>
        </div>
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="kit-area-learn kit-entry">
        <div className="kit-entry-column kit-card overflow-hidden text-center">
          <div className="kit-panel !rounded-b-none !rounded-t-[18px] !border-0 h-[150px]">
            <GuideArt name="guide-encourage" size={130} />
          </div>
          <div className="p-5">
            <h1 className="text-xl font-extrabold [text-wrap:balance]">This reset link has expired</h1>
            <p className="mt-2 text-muted-foreground [text-wrap:pretty]">Links work once and for a short time. Ask for a new one from the sign-in screen.</p>
            <Button className="kit-cta mt-5 w-full" onClick={() => navigate("/auth")}>Back to sign in</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kit-area-learn kit-entry">
      <div className="kit-entry-column kit-card kit-rise overflow-hidden">
        <div className="kit-panel !rounded-b-none !rounded-t-[18px] !border-0 h-[132px]">
          <GuideArt name="guide-encourage" size={120} />
        </div>
        <div className="p-5">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold">Set a new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">At least 6 characters. Enter it twice so we know it's right.</p>
          </div>
          <form onSubmit={handleReset} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" autoComplete="new-password" placeholder="At least 6 characters" value={password}
                onChange={(e) => setPassword(e.target.value)} required minLength={6} maxLength={100} className="kit-field" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" autoComplete="new-password" placeholder="Same password again" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} maxLength={100} className="kit-field" />
            </div>
            <Button type="submit" className="kit-cta w-full" disabled={loading}>
              {loading ? "Updating…" : "Update password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
