import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2, Check, Copy, ShieldCheck, ShieldOff } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type MFAStatus = "idle" | "enrolling" | "verifying" | "unenrolling";

export const TwoFactorSetup = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<MFAStatus>("idle");
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [existingFactorId, setExistingFactorId] = useState<string | null>(null);
  const [unenrollCode, setUnenrollCode] = useState("");

  // Check current MFA status on mount
  useState(() => {
    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        const verifiedTOTP = data.totp?.find(f => f.status === "verified");
        setIsEnabled(!!verifiedTOTP);
        if (verifiedTOTP) setExistingFactorId(verifiedTOTP.id);
      } catch (err) {
        console.error("Failed to check MFA status:", err);
        setIsEnabled(false);
      } finally {
        setLoadingStatus(false);
      }
    };
    checkStatus();
  });

  const handleEnroll = async () => {
    setStatus("enrolling");
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Positive Thots App",
      });
      if (error) throw error;

      setQrUri(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setStatus("verifying");
    } catch (err: any) {
      console.error("MFA enroll error:", err);
      toast.error("Failed to start 2FA setup. Please try again.");
      setStatus("idle");
    }
  };

  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (!factorId || verifyCode.length !== 6) return;
    setVerifying(true);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode,
      });
      if (verify.error) throw verify.error;

      setIsEnabled(true);
      setExistingFactorId(factorId);
      setQrUri(null);
      setSecret(null);
      setFactorId(null);
      setVerifyCode("");
      setStatus("idle");
      toast.success("Two-factor authentication enabled! 🔒");
    } catch (err: any) {
      console.error("MFA verify error:", err);
      toast.error(err.message?.includes("Invalid") ? "Invalid code. Please try again." : "Verification failed. Please try again.");
      setStatus("verifying");
    }
  };

  const handleUnenroll = async () => {
    if (!existingFactorId) return;
    setStatus("unenrolling");
    try {
      // Challenge + verify before unenrolling
      const challenge = await supabase.auth.mfa.challenge({ factorId: existingFactorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId: existingFactorId,
        challengeId: challenge.data.id,
        code: unenrollCode,
      });
      if (verify.error) throw verify.error;

      const { error } = await supabase.auth.mfa.unenroll({ factorId: existingFactorId });
      if (error) throw error;

      setIsEnabled(false);
      setExistingFactorId(null);
      setUnenrollCode("");
      setStatus("idle");
      toast.success("Two-factor authentication disabled.");
    } catch (err: any) {
      console.error("MFA unenroll error:", err);
      toast.error(err.message?.includes("Invalid") ? "Invalid code. Please try again." : "Failed to disable 2FA.");
      setStatus("idle");
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const cancelEnrollment = async () => {
    if (factorId) {
      await supabase.auth.mfa.unenroll({ factorId }).catch(() => {});
    }
    setQrUri(null);
    setSecret(null);
    setFactorId(null);
    setVerifyCode("");
    setStatus("idle");
  };

  if (loadingStatus) {
    return (
      <Card className="animate-fade-in" style={{ animationDelay: "105ms" }}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" /> Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking status…
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in" style={{ animationDelay: "105ms" }}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5" /> Two-Factor Authentication
          {isEnabled && (
            <Badge className="bg-green-500/10 text-green-500 border-green-500/30 text-xs">
              <ShieldCheck className="h-3 w-3 mr-1" /> Enabled
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEnabled && status !== "unenrolling" && (
          <>
            <p className="text-sm text-muted-foreground">
              Your account is protected with two-factor authentication via an authenticator app.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2 text-destructive">
                  <ShieldOff className="h-4 w-4" /> Disable 2FA
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disable two-factor authentication?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This makes your account less secure. Enter your current authenticator code to confirm.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  placeholder="6-digit code"
                  value={unenrollCode}
                  onChange={(e) => setUnenrollCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-widest font-mono"
                />
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setUnenrollCode("")}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleUnenroll}
                    disabled={unenrollCode.length !== 6}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Disable 2FA
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {!isEnabled && status === "idle" && (
          <>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account. You'll need an authenticator app like Google Authenticator or Authy.
            </p>
            <Button onClick={handleEnroll} className="w-full gap-2">
              <Shield className="h-4 w-4" /> Set Up 2FA
            </Button>
          </>
        )}

        {status === "verifying" && qrUri && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm font-medium mb-3">
                Scan this QR code with your authenticator app
              </p>
              <div className="inline-block p-3 bg-white rounded-xl">
                <img src={qrUri} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            </div>

            {secret && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Can't scan? Enter this key manually:
                </Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-muted p-2 rounded break-all select-all">
                    {secret}
                  </code>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copySecret}>
                    {copiedSecret ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="totp-code">Enter the 6-digit code from your app</Label>
              <Input
                id="totp-code"
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest font-mono"
                autoComplete="one-time-code"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={cancelEnrollment}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleVerify}
                disabled={verifyCode.length !== 6 || verifying}
              >
                {verifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Verify & Enable"
                )}
              </Button>
            </div>
          </div>
        )}

        {status === "enrolling" && !qrUri && (
          <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Setting up…
          </div>
        )}
      </CardContent>
    </Card>
  );
};
