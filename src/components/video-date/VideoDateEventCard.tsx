import { useState, useEffect } from "react";
import { useVideoDateRegistration, type VideoDateEvent } from "@/hooks/useVideoDate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, Clock, Video, Loader2, GraduationCap } from "lucide-react";
import { toast } from "sonner";

interface VideoDateEventCardProps {
  event: VideoDateEvent;
}

export const VideoDateEventCard = ({ event }: VideoDateEventCardProps) => {
  const { isRegistered, participantCount, register, isLoading } = useVideoDateRegistration(event.id);
  const [countdown, setCountdown] = useState("");
  const [registering, setRegistering] = useState(false);

  const eventDate = new Date(event.scheduled_at);
  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();
  const isUpcoming = diffMs > 0;
  const isSoon = diffMs > 0 && diffMs < 24 * 60 * 60 * 1000;
  const capacityPercent = Math.min((participantCount / event.max_participants) * 100, 100);
  const isFull = participantCount >= event.max_participants;

  useEffect(() => {
    if (!isUpcoming) return;
    const interval = setInterval(() => {
      const diff = eventDate.getTime() - Date.now();
      if (diff <= 0) { setCountdown("Starting now!"); clearInterval(interval); return; }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setCountdown(`${days}d ${hours % 24}h`);
      } else {
        setCountdown(`${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [eventDate, isUpcoming]);

  const handleRegister = async () => {
    if (isFull) { toast.error("This event is full"); return; }
    setRegistering(true);
    try {
      await register.mutateAsync();
      toast.success("You're registered! 🎉");
    } catch (err: any) {
      toast.error(err.message?.includes("duplicate") ? "Already registered" : "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <Card className="overflow-hidden border-border hover:border-primary/30 transition-colors">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Video className="h-4 w-4 text-primary shrink-0" />
              <h3 className="font-semibold text-base truncate">{event.title}</h3>
            </div>
            {event.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
            )}
          </div>
          {isSoon && (
            <Badge variant="destructive" className="shrink-0 animate-pulse text-sm">
              {countdown}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {eventDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {eventDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {participantCount}/{event.max_participants}
          </span>
          {event.education_tier_required > 0 && (
            <span className="flex items-center gap-1 text-primary">
              <GraduationCap className="h-3.5 w-3.5" />
              Tier {event.education_tier_required}+
            </span>
          )}
        </div>

        <Progress value={capacityPercent} className="h-1.5" />

        <div className="flex items-center gap-2">
          {!isSoon && isUpcoming && countdown && (
            <span className="text-sm text-muted-foreground">Starts in {countdown}</span>
          )}
          <div className="flex-1" />
          {isRegistered ? (
            <Badge className="bg-primary/10 text-primary border-primary/20">✓ Registered</Badge>
          ) : (
            <Button
              size="sm"
              onClick={handleRegister}
              disabled={registering || isFull || !isUpcoming}
              className="min-h-[44px]"
            >
              {registering ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {isFull ? "Full" : "Register"}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{Math.floor(event.round_duration_seconds / 60)}-min rounds · {event.duration_minutes} min total</span>
        </div>
      </CardContent>
    </Card>
  );
};
