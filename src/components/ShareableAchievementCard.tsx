import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Download, Link2, Check } from "lucide-react";
import { toast } from "sonner";
import {
  generateAchievementCard,
  shareAchievement,
  downloadCanvas,
  type AchievementData,
} from "@/lib/shareableCard";
import logoImg from "@/assets/logo.png";
import mascotImg from "@/assets/mascot-celebration.png";

interface ShareableAchievementCardProps {
  open: boolean;
  onClose: () => void;
  data: AchievementData;
  format?: "story" | "square";
}

export const ShareableAchievementCard = memo(
  ({ open, onClose, data, format = "story" }: ShareableAchievementCardProps) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [cardFormat, setCardFormat] = useState<"story" | "square">(format);

    const renderCard = useCallback(() => {
      const logo = new Image();
      logo.crossOrigin = "anonymous";
      const mascot = new Image();
      mascot.crossOrigin = "anonymous";

      let loaded = 0;
      const onLoad = () => {
        loaded++;
        if (loaded < 2) return;
        const canvas = generateAchievementCard(
          data,
          cardFormat,
          mascot.complete && mascot.naturalWidth > 0 ? mascot : null,
          logo.complete && logo.naturalWidth > 0 ? logo : null
        );
        canvasRef.current = canvas;

        if (previewRef.current) {
          previewRef.current.innerHTML = "";
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.style.borderRadius = "12px";
          previewRef.current.appendChild(canvas);
        }
      };

      logo.onload = onLoad;
      logo.onerror = onLoad;
      mascot.onload = onLoad;
      mascot.onerror = onLoad;
      logo.src = logoImg;
      mascot.src = mascotImg;
    }, [data, cardFormat]);

    useEffect(() => {
      if (open) renderCard();
    }, [open, renderCard]);

    const handleShare = async () => {
      if (!canvasRef.current) return;
      setSharing(true);
      try {
        await shareAchievement(canvasRef.current, data);
      } catch {
        toast.error("Share failed");
      } finally {
        setSharing(false);
      }
    };

    const handleDownload = () => {
      if (!canvasRef.current) return;
      downloadCanvas(canvasRef.current);
      toast.success("Image downloaded!");
    };

    const handleCopyLink = async () => {
      try {
        await navigator.clipboard.writeText(
          "https://positivethots.app?utm_source=achievement_share"
        );
        setCopied(true);
        toast.success("Link copied!");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Copy failed");
      }
    };

    return (
      <Dialog open={open} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card">
          {/* Format toggle */}
          <div className="flex gap-2 p-4 pb-0">
            <Button
              variant={cardFormat === "story" ? "default" : "outline"}
              size="sm"
              className="text-sm flex-1"
              onClick={() => setCardFormat("story")}
            >
              Story 9:16
            </Button>
            <Button
              variant={cardFormat === "square" ? "default" : "outline"}
              size="sm"
              className="text-sm flex-1"
              onClick={() => setCardFormat("square")}
            >
              Square 1:1
            </Button>
          </div>

          {/* Preview */}
          <div className="px-4 pt-2">
            <div
              ref={previewRef}
              className="w-full rounded-xl overflow-hidden border border-border/30 bg-muted/20"
              style={{ maxHeight: cardFormat === "story" ? "50vh" : "40vh" }}
            />
          </div>

          {/* Actions */}
          <div className="p-4 flex gap-2">
            <Button onClick={handleShare} disabled={sharing} className="flex-1 gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleCopyLink} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

ShareableAchievementCard.displayName = "ShareableAchievementCard";
