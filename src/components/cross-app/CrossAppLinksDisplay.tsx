import { useState } from "react";
import { useCrossAppLinksProfile, SUPPORTED_PLATFORMS, type CrossAppLink } from "@/hooks/useCrossAppLinks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CrossAppLinksDisplayProps {
  userId: string;
}

export const CrossAppLinksDisplay = ({ userId }: CrossAppLinksDisplayProps) => {
  const { data: links = [] } = useCrossAppLinksProfile(userId);
  const [interstitialLink, setInterstitialLink] = useState<CrossAppLink | null>(null);

  if (links.length === 0) return null;

  const hasSeenWarning = () => {
    return sessionStorage.getItem("pt_external_link_warned") === "true";
  };

  const handleLinkClick = (link: CrossAppLink) => {
    if (hasSeenWarning()) {
      window.open(link.url, "_blank", "noopener,noreferrer");
    } else {
      setInterstitialLink(link);
    }
  };

  const confirmNavigate = () => {
    if (!interstitialLink) return;
    sessionStorage.setItem("pt_external_link_warned", "true");
    window.open(interstitialLink.url, "_blank", "noopener,noreferrer");
    setInterstitialLink(null);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {links.map((link, idx) => {
          const platform = SUPPORTED_PLATFORMS.find(p => p.id === link.platform);
          if (!platform) return null;
          return (
            <button
              key={idx}
              onClick={() => handleLinkClick(link)}
              className="flex items-center justify-center w-9 h-9 rounded-full border border-border hover:border-primary/50 transition-colors"
              style={{ backgroundColor: `${platform.color}15` }}
              aria-label={`Visit ${platform.label} profile`}
              title={platform.label}
            >
              <span className="text-sm" style={{ color: platform.color }}>
                {platform.icon}
              </span>
            </button>
          );
        })}
      </div>

      <Dialog open={!!interstitialLink} onOpenChange={() => setInterstitialLink(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Leaving Positive Thots</DialogTitle>
            <DialogDescription>
              You're about to visit{" "}
              <strong>
                {SUPPORTED_PLATFORMS.find(p => p.id === interstitialLink?.platform)?.label}
              </strong>
              . Links shared by users aren't verified by Positive Thots.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setInterstitialLink(null)}>
              Cancel
            </Button>
            <Button onClick={confirmNavigate}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
