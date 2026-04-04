import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Loader2, Camera, Check, X, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface FaceVerificationFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const POSES = ["Smile", "Look left", "Look right", "Neutral expression", "Thumbs up"];

type Step = "intro" | "camera" | "processing" | "success" | "failure";

export const FaceVerificationFlow = ({ open, onOpenChange }: FaceVerificationFlowProps) => {
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState<Step>("intro");
  const [pose] = useState(() => POSES[Math.floor(Math.random() * POSES.length)]);
  const [attempts, setAttempts] = useState(0);

  const handleCapture = async () => {
    setStep("processing");
    try {
      // Use file input for camera capture (iOS Safari compatible)
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "user";

      const file = await new Promise<File | null>((resolve) => {
        input.onchange = () => resolve(input.files?.[0] || null);
        input.click();
        // Timeout if user cancels
        setTimeout(() => resolve(null), 60000);
      });

      if (!file) {
        setStep("camera");
        return;
      }

      // Upload to storage
      const path = `face-verifications/${user!.id}/${Date.now()}.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from("verification-selfies")
        .upload(path, file, { contentType: file.type });

      if (uploadErr) throw uploadErr;

      // Create verification record
      const { data: verification, error: verErr } = await supabase
        .from("face_verifications")
        .insert({
          user_id: user!.id,
          pose_requested: pose,
          selfie_url: path,
          attempt_count: attempts + 1,
          expires_at: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();
      if (verErr) throw verErr;

      // Call verification edge function
      const { data: result, error: fnErr } = await supabase.functions.invoke("moderate-photo", {
        body: { photo_id: verification.id, mode: "verification" },
      });

      if (fnErr) throw fnErr;

      if (result?.verified) {
        // Update profile
        await supabase.from("profiles").update({
          is_face_verified: true,
          face_verified_at: new Date().toISOString(),
        }).eq("id", user!.id);

        await supabase.from("face_verifications").update({
          status: "verified",
          verified_at: new Date().toISOString(),
        }).eq("id", verification.id);

        setStep("success");
      } else {
        await supabase.from("face_verifications").update({
          status: "failed",
        }).eq("id", verification.id);

        setAttempts(a => a + 1);
        setStep("failure");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setAttempts(a => a + 1);
      setStep("failure");
    }
  };

  const reset = () => {
    setStep("intro");
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        {step === "intro" && (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Verify Your Profile</h2>
            <p className="text-sm text-muted-foreground">It takes 30 seconds</p>
            <ul className="text-sm text-left space-y-2 max-w-xs mx-auto">
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Get a Verified badge</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Higher visibility in Discovery</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Build trust with matches</li>
            </ul>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => setStep("camera")}>
                <Camera className="h-4 w-4 mr-2" /> Start Verification
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
                Maybe Later
              </Button>
            </div>
          </div>
        )}

        {step === "camera" && (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto w-60 h-72 rounded-[50%] border-4 border-primary/50 border-dashed flex items-center justify-center bg-muted/20">
              <Camera className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-primary">{pose}</p>
            <p className="text-sm text-muted-foreground">
              Take a selfie matching this pose
            </p>
            <Button className="w-full" size="lg" onClick={handleCapture}>
              <Camera className="h-5 w-5 mr-2" /> Take Photo
            </Button>
          </div>
        )}

        {step === "processing" && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h3 className="text-lg font-semibold">Checking your photo...</h3>
            <p className="text-sm text-muted-foreground">This usually takes 5-10 seconds</p>
          </div>
        )}

        {step === "success" && (
          <div className="py-6 text-center space-y-4">
            <div className={cn(
              "mx-auto h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center",
              !reducedMotion && "animate-in zoom-in duration-500"
            )}>
              <Check className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-xl font-bold">You're Verified! ✓</h2>
            <p className="text-sm text-muted-foreground">
              Your profile now shows a verified badge
            </p>
            <Button className="w-full" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        )}

        {step === "failure" && (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <X className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">Hmm, we couldn't verify that photo</h2>
            <p className="text-sm text-muted-foreground">
              Could you try again? Make sure your face is clearly visible and matches the pose.
            </p>
            {attempts < 3 ? (
              <div className="space-y-2">
                <Button className="w-full" onClick={() => setStep("camera")}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Try Again
                </Button>
                <p className="text-xs text-muted-foreground">{3 - attempts} attempts remaining today</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-amber-400">Maximum attempts reached. Try again tomorrow.</p>
                <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
