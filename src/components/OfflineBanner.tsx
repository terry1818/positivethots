import { GuideArt } from "@/components/mascot/GuideArt";
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground text-sm font-medium flex items-center justify-center gap-2 py-2 px-4 safe-top" role="alert">
      <GuideArt name="guide-sleepy" size={36} animate={false} />
      You're offline — showing cached content
    </div>
  );
};
