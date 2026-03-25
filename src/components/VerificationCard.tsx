import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { isNative, takeNativePhoto } from "@/lib/capacitor";

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
  latestRequest,
  onVerificationChange,
}: VerificationCardProps) => {
  const [showCamera, setShowCamera] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 640 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to actually start playing before showing capture button
        await new Promise<void>((resolve) => {
          const video = videoRef.current!;
          const onPlaying = () => {
            video.removeEventListener("loadeddata", onPlaying);
            resolve();
          };
          if (video.readyState >= 2) {
            resolve();
          } else {
            video.addEventListener("loadeddata", onPlaying);
          }
        });
      }
      setShowCamera(true);
    } catch {
      toast.error("Could not access camera. Please allow camera permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setShowCamera(false);
  }, []);

  const captureAndSubmit = async () => {
    setSubmitting(true);

    try {
      let blob: Blob;

      if (isNative()) {
        const nativeBlob = await takeNativePhoto();
        if (!nativeBlob) {
          setSubmitting(false);
          return;
        }
        blob = nativeBlob;
      } else {
      if (!videoRef.current || videoRef.current.videoWidth === 0) {
          toast.error("Camera not ready. Please wait a moment and try again.");
          setSubmitting(false);
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext("2d")!.drawImage(videoRef.current, 0, 0);

        blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob((b) => {
            if (b && b.size > 0) resolve(b);
            else reject(new Error("Failed to capture photo"));
          }, "image/jpeg", 0.85)
        );

        stopCamera();
      }

      if (!blob || blob.size === 0) {
        toast.error("Failed to capture photo. Please try again.");
        setSubmitting(false);
        return;
      }

      const path = `${userId}/verification/${crypto.randomUUID()}.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from("user-photos")
        .upload(path, blob, { contentType: "image/jpeg" });
      if (uploadErr) throw uploadErr;

      const { data: verReq, error: insertErr } = await supabase
        .from("verification_requests")
        .insert({ user_id: userId, selfie_path: path, status: "pending" })
        .select()
        .single();
      if (insertErr) throw insertErr;

      // Trigger verification
      const { data: result } = await supabase.functions.invoke("moderate-photo", {
        body: { photo_id: verReq.id, mode: "verification" },
      });

      if (result?.verified) {
        toast.success("You're verified! 🎉");
      } else {
        toast.error(result?.reason || "Verification failed. Please try again.");
      }

      onVerificationChange();
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (isVerified) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-green-500" />
          <div>
            <p className="font-medium text-green-700 dark:text-green-400">Identity Verified</p>
            <p className="text-xs text-muted-foreground">Your profile has a verified badge</p>
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
          Get Verified
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Take a selfie to verify your identity. We'll compare it with your profile photos
          to confirm you're real. Verified users get a trust badge.
        </p>

        {latestRequest?.status === "pending" && (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Verification pending
          </Badge>
        )}

        {latestRequest?.status === "rejected" && (
          <div className="text-sm text-destructive">
            Previous attempt rejected: {latestRequest.reason || "Unknown reason"}
          </div>
        )}

        {showCamera ? (
          <div className="space-y-3">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
                style={{ transform: "scaleX(-1)" }}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={captureAndSubmit} disabled={submitting} className="flex-1">
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 mr-1" />
                )}
                {submitting ? "Verifying..." : "Take Selfie"}
              </Button>
              <Button variant="outline" onClick={stopCamera} disabled={submitting}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={isNative() ? captureAndSubmit : startCamera} variant="outline" className="w-full">
            <Camera className="h-4 w-4 mr-2" />
            Start Verification
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
