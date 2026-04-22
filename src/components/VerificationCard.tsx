import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VerificationCardProps {
  userId: string;
  isVerified: boolean;
  hasApprovedPhotos: boolean;
  latestRequest?: { status: string; reason?: string | null } | null;
  onVerificationChange: () => void;
}

export const VerificationCard = ({
  userId,
  isVerified,
  hasApprovedPhotos,
  latestRequest,
  onVerificationChange,
}: VerificationCardProps) => {
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected if needed
    e.target.value = "";

    setSubmitting(true);
    try {
      const path = `${userId}/verification/${crypto.randomUUID()}.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from("verification-selfies")
        .upload(path, file, { contentType: file.type || "image/jpeg" });
      if (uploadErr) throw uploadErr;

      const { data: verReq, error: insertErr } = await supabase
        .from("verification_requests")
        .insert({ user_id: userId, selfie_path: path, status: "pending" })
        .select()
        .single();
      if (insertErr) throw insertErr;

      const { data: result } = await supabase.functions.invoke("moderate-photo", {
        body: { photo_id: verReq.id, mode: "verification" },
      });

      if (result?.verified) {
        toast.success("Verified! Your profile now shows a checkmark.");
      } else {
        toast.error("We couldn't verify your photo. Try again in good lighting with your face clearly visible.");
      }
      onVerificationChange();
    } catch (err) {
      console.error("Verification error:", err);
      toast.error("Verification failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasApprovedPhotos && !isVerified) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-amber-500" />
          <div>
            <p className="font-medium text-amber-700 dark:text-amber-400">Verification Unavailable</p>
            <p className="text-sm text-muted-foreground">
              You need at least one approved profile photo before verifying your identity. Please upload a photo and wait for it to be approved.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isVerified) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-green-500" />
          <div>
            <p className="font-medium text-green-700 dark:text-green-400">Identity Verified</p>
            <p className="text-sm text-muted-foreground">Your profile has a verified badge</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Verify Your Photos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Take a quick selfie to prove your photos are really you. Verified profiles get a checkmark badge.
        </p>

        {latestRequest?.status === "pending" && (
          <div className="space-y-1">
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Verification in progress
            </Badge>
            <p className="text-xs text-muted-foreground">Usually takes under an hour.</p>
          </div>
        )}

        {latestRequest?.status === "rejected" && (
          <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3 space-y-2">
            <p className="text-sm">
              We couldn't verify your photo. Try again in good lighting with your face clearly visible.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Privacy disclosure — required for biometric data compliance (BIPA) */}
        <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 border border-border/50">
          <p className="flex items-start gap-2">
            <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
            <span>
              Your verification selfie is stored securely and deleted within 7 days. It's only used to confirm your identity — never shared or shown on your profile.
            </span>
          </p>
        </div>

        {/* Hidden file input — capture="user" opens front camera on mobile */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleFileSelected}
        />

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={submitting || latestRequest?.status === "pending"}
          variant="outline"
          className="w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying your identity...
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" />
              Verify Your Photos
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
