import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface VideoDateRoomProps {
  roundDurationSeconds: number;
  partnerName: string;
  icebreakerPrompt: string;
  onRoundEnd: (interested: boolean) => void;
}

export const VideoDateRoom = ({
  roundDurationSeconds,
  partnerName,
  icebreakerPrompt,
  onRoundEnd,
}: VideoDateRoomProps) => {
  const [timeLeft, setTimeLeft] = useState(roundDurationSeconds);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [showVote, setShowVote] = useState(false);

  const timerPercent = (timeLeft / roundDurationSeconds) * 100;
  const isWarning = timeLeft <= 60;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowVote(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (showVote) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="max-w-sm w-full space-y-6 text-center">
          <h2 className="text-2xl font-bold">Time's up! ⏰</h2>
          <p className="text-muted-foreground">
            How did it go with <strong>{partnerName}</strong>?
          </p>
          <div className="space-y-3">
            <Button
              className="w-full min-h-[48px] text-base bg-gradient-to-r from-primary to-secondary"
              onClick={() => onRoundEnd(true)}
            >
              Yes, I'm Interested 💜
            </Button>
            <Button
              variant="outline"
              className="w-full min-h-[48px] text-base"
              onClick={() => onRoundEnd(false)}
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      {/* Timer Bar */}
      <div className="absolute top-0 left-0 right-0 z-30">
        <div
          className={cn(
            "h-1 transition-all duration-1000",
            isWarning ? "bg-destructive" : timerPercent > 50 ? "bg-green-500" : "bg-yellow-500"
          )}
          style={{ width: `${timerPercent}%` }}
        />
        <div className="flex items-center justify-between px-4 py-2">
          <Badge variant="outline" className="bg-black/60 text-white border-white/20">
            {partnerName}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "bg-black/60 border-white/20 font-mono text-base",
              isWarning ? "text-destructive animate-pulse" : "text-white"
            )}
          >
            {mins}:{String(secs).padStart(2, "0")}
          </Badge>
        </div>
      </div>

      {/* Remote Video (placeholder) */}
      <div className="flex-1 flex items-center justify-center bg-muted/10">
        <div className="text-center space-y-2">
          <Video className="h-16 w-16 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground text-sm">Connecting video...</p>
          <p className="text-xs text-muted-foreground">WebRTC integration pending</p>
        </div>
      </div>

      {/* Local Video (inset) */}
      <div className="absolute bottom-24 right-4 w-20 h-28 rounded-xl bg-muted/30 border border-white/20 overflow-hidden z-20">
        <div className="w-full h-full flex items-center justify-center">
          {cameraEnabled ? (
            <Video className="h-6 w-6 text-muted-foreground" />
          ) : (
            <VideoOff className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Icebreaker Prompt */}
      {!showVote && (
        <div className="absolute bottom-24 left-4 right-28 z-20">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl p-3 flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-white/90">{icebreakerPrompt}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-6 safe-area-bottom">
        <div className="flex items-center justify-center gap-4 px-4">
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-12 w-12 rounded-full",
              !micEnabled && "bg-destructive/20 border-destructive text-destructive"
            )}
            onClick={() => setMicEnabled(!micEnabled)}
            aria-label={micEnabled ? "Mute" : "Unmute"}
          >
            {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-12 w-12 rounded-full",
              !cameraEnabled && "bg-destructive/20 border-destructive text-destructive"
            )}
            onClick={() => setCameraEnabled(!cameraEnabled)}
            aria-label={cameraEnabled ? "Turn camera off" : "Turn camera on"}
          >
            {cameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="h-14 w-14 rounded-full"
                aria-label="End round early"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End this round?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure? You can't redo this round.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Stay</AlertDialogCancel>
                <AlertDialogAction onClick={() => setShowVote(true)}>
                  End Round
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};
