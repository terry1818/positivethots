import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ExternalLink, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const BDSM_URL_REGEX = /^https?:\/\/(www\.)?bdsmtest\.org\/r\//;

interface BdsmTestSectionProps {
  bdsmTestUrl: string;
  bdsmTestScreenshot: string;
  onUrlChange: (url: string) => void;
  onScreenshotChange: (url: string) => void;
  userId: string;
  onChange: () => void;
}

export const BdsmTestSection = ({
  bdsmTestUrl,
  bdsmTestScreenshot,
  onUrlChange,
  onScreenshotChange,
  userId,
  onChange,
}: BdsmTestSectionProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/bdsm-test-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("user-photos")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("user-photos")
        .getPublicUrl(path);

      onScreenshotChange(urlData.publicUrl);
      onChange();
      toast.success("Screenshot uploaded!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload screenshot");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveScreenshot = () => {
    onScreenshotChange("");
    onChange();
  };

  const urlError = bdsmTestUrl && !BDSM_URL_REGEX.test(bdsmTestUrl);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Kink Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bdsm-url">
            BDSMtest.org Results URL
          </Label>
          <div className="flex gap-2">
            <Input
              id="bdsm-url"
              value={bdsmTestUrl}
              onChange={(e) => {
                onUrlChange(e.target.value);
                onChange();
              }}
              placeholder="https://bdsmtest.org/r/..."
              className={urlError ? "border-destructive focus-glow" : "focus-glow"}
            />
            {bdsmTestUrl && BDSM_URL_REGEX.test(bdsmTestUrl) && (
              <Button variant="outline" size="icon" asChild>
                <a href={bdsmTestUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
          {urlError && (
            <p className="text-sm text-destructive">
              URL must be a bdsmtest.org results link (e.g. https://bdsmtest.org/r/abc123)
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Take the test at{" "}
            <a
              href="https://bdsmtest.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              bdsmtest.org
            </a>{" "}
            and paste your results link here.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Results Screenshot (optional)</Label>
          {bdsmTestScreenshot ? (
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img
                src={bdsmTestScreenshot}
                alt="BDSM test results"
                className="w-full max-h-64 object-contain bg-muted"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={handleRemoveScreenshot}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                "Uploading..."
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Screenshot
                </>
              )}
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleScreenshotUpload}
          />
        </div>
      </CardContent>
    </Card>
  );
};
