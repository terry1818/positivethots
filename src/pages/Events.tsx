import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { useFeatureUnlocks } from "@/hooks/useFeatureUnlocks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BottomNav } from "@/components/BottomNav";
import { Calendar, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { EventCard, type EventData } from "@/components/events/EventCard";
import { SearchInput } from "@/components/SearchInput";

type EventTier = "community" | "premium" | "adults_only";

const Events = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isPremium, tier: subscriptionTier } = useSubscription();
  const { isFeatureUnlocked } = useFeatureUnlocks();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<string[]>([]);
  const [rsvps, setRsvps] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<EventTier>("community");
  const [eventSearch, setEventSearch] = useState("");
  const handleEventSearch = useCallback((q: string) => setEventSearch(q.toLowerCase()), []);

  const hasEventsAccess = isFeatureUnlocked("events_access");
  const isVIP = subscriptionTier === "vip";

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

      setEvents((eventsData as EventData[]) ?? []);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const [regsResult, rsvpsResult] = await Promise.all([
          supabase.from("event_registrations").select("event_id").eq("user_id", session.user.id),
          supabase.from("event_rsvps").select("event_id").eq("user_id", session.user.id).neq("status", "cancelled"),
        ]);
        setRegistrations(regsResult.data?.map((r) => r.event_id) ?? []);
        setRsvps(rsvpsResult.data?.map((r) => r.event_id) ?? []);
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

  const handleRsvp = async (eventId: string) => {
    // Optimistic: immediately show RSVP'd state
    setRsvps((prev) => [...prev, eventId]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setRsvps((prev) => prev.filter((id) => id !== eventId)); toast.error("Please sign in"); return; }

      const { error } = await supabase.from("event_rsvps").insert({
        event_id: eventId,
        user_id: session.user.id,
        status: "confirmed",
      });
      if (error) throw error;
      toast.success("You're in! 🎉");
    } catch (err: any) {
      // Rollback
      setRsvps((prev) => prev.filter((id) => id !== eventId));
      toast.error(err.message?.includes("duplicate") ? "You've already RSVP'd" : "RSVP failed, try again");
    }
  };

  const handleCancelRsvp = async (eventId: string) => {
    // Optimistic: immediately revert to un-RSVP'd state
    const previousRsvps = [...rsvps];
    setRsvps((prev) => prev.filter((id) => id !== eventId));

    const reRsvp = () => {
      setRsvps(prev => [...prev, eventId]);
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setRsvps(previousRsvps); return; }
      const { error } = await supabase.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", session.user.id);
      if (error) throw error;
      toast("RSVP cancelled", {
        duration: 5000,
        action: { label: "Undo", onClick: async () => {
          reRsvp();
          const { data: { session: s } } = await supabase.auth.getSession();
          if (s) {
            await supabase.from("event_rsvps").insert({ event_id: eventId, user_id: s.user.id, status: "confirmed" });
          }
        }},
      });
    } catch {
      // Rollback
      setRsvps(previousRsvps);
      toast.error("Failed to cancel RSVP, try again");
    }
  };

  const addToCalendar = (event: EventData) => {
    const start = new Date(event.event_date);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(event.description || "")}`;
    window.open(url, "_blank");
  };

  const canAccessTier = (tier: string): { allowed: boolean; reason?: string } => {
    if (tier === "community") return { allowed: true };
    if (tier === "premium") return isPremium ? { allowed: true } : { allowed: false, reason: "premium" };
    // adults_only requires Advanced education + VIP
    if (!hasEventsAccess) return { allowed: false, reason: "education" };
    if (!isVIP) return { allowed: false, reason: "vip" };
    return { allowed: true };
  };

  const tierEvents = (tier: EventTier) => {
    let filtered = events.filter((e) => e.event_tier === tier);
    if (eventSearch) filtered = filtered.filter(e => e.title.toLowerCase().includes(eventSearch));
    return filtered;
  };

  const tierDescriptions: Record<EventTier, string> = {
    community: "Free events open to all members",
    premium: "Exclusive meetups for premium subscribers",
    adults_only: "Intimate events for educated, verified members",
  };

  const renderEventList = (tier: EventTier) => {
    const filtered = tierEvents(tier);
    const access = canAccessTier(tier);

    if (loading) {
      return (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-1">No upcoming events</h3>
            <p className="text-muted-foreground text-sm">Check back soon for new {tier === "community" ? "community" : tier === "premium" ? "premium" : "adults-only"} events!</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {filtered.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isRegistered={registrations.includes(event.id)}
            isRsvpd={rsvps.includes(event.id)}
            canAccess={access.allowed}
            accessReason={access.reason}
            isVIP={isVIP}
            purchasing={purchasing}
            rsvpLoading={rsvpLoading}
            onPurchase={handlePurchase}
            onRsvp={handleRsvp}
            onCancelRsvp={handleCancelRsvp}
            onAddToCalendar={addToCalendar}
            onUpgrade={() => navigate("/premium")}
            onLearn={() => navigate("/learn")}
          />
        ))}
      </div>
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
            <p className="text-sm text-muted-foreground">Learn, connect, and grow</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EventTier)} className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="community" className="text-xs sm:text-sm">
              🌐 Community
            </TabsTrigger>
            <TabsTrigger value="premium" className="text-xs sm:text-sm">
              👑 Premium
            </TabsTrigger>
            <TabsTrigger value="adults_only" className="text-xs sm:text-sm">
              🔒 Adults Only
            </TabsTrigger>
          </TabsList>

          <p className="text-xs text-muted-foreground mb-4 text-center">{tierDescriptions[activeTab]}</p>

          <TabsContent value="community">{renderEventList("community")}</TabsContent>
          <TabsContent value="premium">{renderEventList("premium")}</TabsContent>
          <TabsContent value="adults_only">{renderEventList("adults_only")}</TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
};

export default Events;
