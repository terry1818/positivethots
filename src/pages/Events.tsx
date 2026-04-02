import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { useFeatureUnlocks } from "@/hooks/useFeatureUnlocks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/BottomNav";
import {
  Calendar,
  ArrowLeft,
  Loader2,
  Users,
  Ticket,
  Crown,
  MapPin,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { Logo } from "@/components/Logo";

interface Event {
  id: string;
  title: string;
  description: string | null;
  host_name: string;
  event_date: string;
  price_cents: number;
  capacity: number;
  image_url: string | null;
  is_active: boolean;
}

const Events = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isPremium, tier: subscriptionTier } = useSubscription();
  const { isFeatureUnlocked } = useFeatureUnlocks();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<string[]>([]);

  const hasEventsAccess = isFeatureUnlocked("events_access");
  const isVIP = subscriptionTier === "vip";
  const isFullyUnlocked = hasEventsAccess && isVIP;

  useEffect(() => {
    if (searchParams.get("registered")) {
      toast.success("You're registered! Check your email for details 🎉");
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });

      setEvents(eventsData ?? []);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: regs } = await supabase
          .from("event_registrations")
          .select("event_id")
          .eq("user_id", session.user.id);
        setRegistrations(regs?.map((r) => r.event_id) ?? []);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handlePurchase = async (eventId: string) => {
    setPurchasing(eventId);
    try {
      const { data, error } = await supabase.functions.invoke("create-event-checkout", {
        body: { event_id: eventId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setPurchasing(null);
    }
  };

  const addToCalendar = (event: Event) => {
    const start = new Date(event.event_date);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(event.description || "")}`;
    window.open(url, "_blank");
  };

  const subtitleText = !hasEventsAccess
    ? "Complete the full curriculum to access community events"
    : !isVIP
      ? "Upgrade to VIP to purchase event tickets"
      : "Learn, connect, and grow";

  const renderEventCard = (event: Event) => {
    const isRegistered = registrations.includes(event.id);
    const priceFormatted = (event.price_cents / 100).toFixed(2);
    const discountedPrice = isVIP
      ? ((event.price_cents * 0.75) / 100).toFixed(2)
      : null;
    const eventDate = new Date(event.event_date);
    const isPast = eventDate < new Date();

    return (
      <Card key={event.id} className="overflow-hidden transition-all hover:-translate-y-0.5">
        {event.image_url && (
          <div className="h-40 overflow-hidden">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{event.title}</CardTitle>
            {isRegistered && (
              <Badge className="bg-primary text-primary-foreground">Registered</Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(eventDate, "MMM d, yyyy · h:mm a")}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {event.capacity} spots
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {event.host_name}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {event.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {event.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              {discountedPrice ? (
                <>
                  <span className="text-lg font-bold text-primary">${discountedPrice}</span>
                  <span className="text-sm text-muted-foreground line-through">${priceFormatted}</span>
                </>
              ) : (
                <span className="text-lg font-bold">${priceFormatted}</span>
              )}
            </div>
            <div className="flex gap-2">
              {isFullyUnlocked ? (
                <>
                  {isRegistered && (
                    <Button variant="outline" size="sm" onClick={() => addToCalendar(event)}>
                      <Calendar className="h-4 w-4 mr-1" /> Add to Calendar
                    </Button>
                  )}
                  {!isRegistered && !isPast && (
                    <Button size="sm" onClick={() => handlePurchase(event.id)} disabled={purchasing !== null}>
                      {purchasing === event.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <><Ticket className="h-4 w-4 mr-1" /> Get Ticket</>
                      )}
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-right">
                  <Button size="sm" variant="outline" onClick={() => navigate("/premium")}>
                    <Crown className="h-4 w-4 mr-1" /> VIP Required
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">VIP members get full event access</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <header className="flex items-center justify-center mb-4">
          <Logo size="md" />
        </header>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Events & Workshops</h1>
            <p className="text-sm text-muted-foreground">
              {subtitleText}
              {isFullyUnlocked && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  <Crown className="h-3 w-3 mr-1" /> 25% off
                </Badge>
              )}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !hasEventsAccess ? (
          /* State 1: Education not complete — blurred skeletons with overlay */
          <div className="relative">
            <div className="space-y-4 blur-sm pointer-events-none select-none" aria-hidden="true">
              {[1, 2, 3].map(i => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-40 bg-gradient-to-br from-primary/20 to-secondary/20" />
                  <CardHeader>
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-muted rounded w-full mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 gap-4">
              <div className="bg-background/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-border max-w-sm">
                <div className="text-4xl mb-3">🎓</div>
                <h3 className="font-bold text-lg mb-2">Complete Advanced Topics to Unlock Events</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Community events and workshops are reserved for members who have completed the full education curriculum — including the Advanced Topics tier. This ensures every attendee arrives with shared knowledge and intentions.
                </p>
                <div className="space-y-2 text-left mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-success">✓</span>
                    <span className="text-muted-foreground">Foundation (Required)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">○</span>
                    <span className="text-muted-foreground">Sexual Health</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">○</span>
                    <span className="text-muted-foreground">Identity & Diversity</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">○</span>
                    <span className="text-muted-foreground">Healthy Relationships</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="text-primary">★</span>
                    <span>Advanced Topics — unlocks Events</span>
                  </div>
                </div>
                <Button className="w-full" onClick={() => navigate("/learn")}>
                  Continue Learning →
                </Button>
              </div>
            </div>
          </div>
        ) : !isVIP ? (
          /* State 2: Education complete, not VIP */
          <div className="space-y-4">
            <Card className="bg-gradient-to-r from-amber-500/10 to-primary/10 border-amber-500/20">
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <Crown className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">VIP Access Required</p>
                  <p className="text-xs text-muted-foreground">
                    You've completed the curriculum! Upgrade to VIP to purchase event tickets and get 25% off every event.
                  </p>
                </div>
                <Button size="sm" variant="outline" className="shrink-0 border-amber-500/40 text-amber-600" onClick={() => navigate("/premium")}>
                  Upgrade
                </Button>
              </CardContent>
            </Card>
            {events.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-1">No upcoming events</h3>
                  <p className="text-muted-foreground text-sm">Check back soon for workshops and meetups!</p>
                </CardContent>
              </Card>
            ) : (
              events.map(renderEventCard)
            )}
          </div>
        ) : events.length === 0 ? (
          /* State 3: Fully unlocked, no events */
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-1">No upcoming events</h3>
              <p className="text-muted-foreground text-sm">Check back soon for workshops and meetups!</p>
            </CardContent>
          </Card>
        ) : (
          /* State 3: Fully unlocked with events */
          <div className="space-y-4">
            {events.map(renderEventCard)}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Events;
