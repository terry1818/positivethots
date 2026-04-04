import { useState, useEffect } from "react";
import { type VideoDateEvent } from "@/hooks/useVideoDate";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Video, Mic, MicOff, VideoOff, Users, Clock, ArrowLeft, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface VideoDateLobbyProps {
  event: VideoDateEvent;
  onReady: () => void;
  onBack: () => void;
}

const ICEBREAKER_TIPS = [
  "Ask about their favorite ENM book or podcast",
  "Share something you learned from a recent education module",
  "Ask what their ideal polycule brunch looks like",
  "Talk about your communication style preferences",
  "Ask what brought them to Positive Thots",
];

export const VideoDateLobby = ({ event, onReady, onBack }: VideoDateLobbyProps) => {
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [countdown, setCountdown] = useState("");
  const [canStart, setCanStart] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);
  const [participantCount, setParticipantCount] = useState(0);

  const eventDate = new Date(event.scheduled_at);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = eventDate.getTime() - Date.now();
      if (diff <= 0) { setCountdown("Starting!"); setCanStart(true); return; }
      const mins = Math.floor(diff / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${mins}:${String(secs).padStart(2, "0")}`);
      setCanStart(diff <= 2 * 60 * 1000); // 2 minutes before
    }, 1000);
    return () => clearInterval(interval);
  }, [eventDate]);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip(i => (i + 1) % ICEBREAKER_TIPS.length);
    }, 8000);
    return () => clearInterval(tipInterval);
  }, []);

  useEffect(() => {
    const loadCount = async () => {
      const { count } = await supabase
        .from("video_date_participants")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id)
        .in("status", ["registered", "checked_in"]);
      setParticipantCount(count || 0);
    };
    loadCount();
  }, [event.id]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold">{event.title}</h1>
            <p className="text-sm text-muted-foreground">Lobby</p>
          </div>
          <Badge variant="outline" className="animate-pulse">
            <Clock className="h-3 w-3 mr-1" />
            {countdown}
          </Badge>
        </div>
      </header>

      <main className="flex-1 container max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Participant Count */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" /> Participants
              </span>
              <span className="text-sm text-muted-foreground">{participantCount}/{event.max_participants}</span>
            </div>
            <Progress value={(participantCount / event.max_participants) * 100} className="h-2" />
          </CardContent>
        </Card>

        {/* Camera/Mic Check */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-medium text-sm">Camera & Mic Check</h3>
            <div className="flex gap-3">
              <Button
                variant={cameraEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setCameraEnabled(!cameraEnabled)}
                className="flex-1 min-h-[44px]"
              >
                {cameraEnabled ? <Video className="h-4 w-4 mr-1" /> : <VideoOff className="h-4 w-4 mr-1" />}
                Camera {cameraEnabled ? "On" : "Off"}
              </Button>
              <Button
                variant={micEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setMicEnabled(!micEnabled)}
                className="flex-1 min-h-[44px]"
              >
                {micEnabled ? <Mic className="h-4 w-4 mr-1" /> : <MicOff className="h-4 w-4 mr-1" />}
                Mic {micEnabled ? "On" : "Off"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Icebreaker Tips */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">Icebreaker Tip</p>
                <p className="text-sm">{ICEBREAKER_TIPS[currentTip]}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ready Button */}
        <Button
          className="w-full min-h-[48px] text-base"
          disabled={!canStart}
          onClick={onReady}
        >
          {canStart ? "Ready to Start! 🎬" : `Starts in ${countdown}`}
        </Button>
      </main>
    </div>
  );
};
