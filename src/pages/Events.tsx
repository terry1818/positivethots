import { GuideArt } from "@/components/mascot/GuideArt";
import { useState, useEffect, useCallback, type CSSProperties } from "react";
import { useTutorialState } from "@/hooks/useTutorialState";
import { SpotlightTour, type TourStep } from "@/components/SpotlightTour";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { useFeatureUnlocks } from "@/hooks/useFeatureUnlocks";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/components/BottomNav";
import { BrandedEmptyState } from "@/components/BrandedEmptyState";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
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
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const { seen: eventsTourSeen, markSeen: markEventsTourSeen } = useTutorialState("events_tour");
  const [showEventsTour, setShowEventsTour] = useState(false);

  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<string[]>([]);
  const [rsvps, setRsvps] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<EventTier>("community");
  const [eventSearch, setEventSearch] = useState("");
  const [searchKey, setSearchKey] = useState(0);
  const handleEventSearch = useCallback((q: string) => setEventSearch(q.toLowerCase()), []);

  const hasEventsAccess = isFeatureUnlocked("events_access");
  const isVIP = subscriptionTier === "vip";

  useEffect(() => {
    if (searchParams.get("registered")) {
      toast.success("You're registered. Check your email for the details.");
    }
  }, [searchParams]);

  // The tour points at real things, so it waits until the page has loaded without an error.
  useEffect(() => {
    if (loading || loadError || eventsTourSeen) return;
    const t = setTimeout(() => setShowEventsTour(true), 600);
    return () => clearTimeout(t);
  }, [loading, loadError, eventsTourSeen]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const { data: eventsData, error } = await supabase
          .from("events")
          .select("*")
          .eq("is_active", true)
          .gte("event_date", new Date().toISOString())
          .order("event_date", { ascending: true });
        if (error) throw error;

        let regs: string[] = [];
        let going: string[] = [];
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const [regsResult, rsvpsResult] = await Promise.all([
            supabase.from("event_registrations").select("event_id").eq("user_id", session.user.id),
            supabase.from("event_rsvps").select("event_id").eq("user_id", session.user.id).neq("status", "cancelled"),
          ]);
          regs = regsResult.data?.map((r) => r.event_id) ?? [];
          going = rsvpsResult.data?.map((r) => r.event_id) ?? [];
        }
        if (cancelled) return;
        setEvents((eventsData as EventData[]) ?? []);
        setRegistrations(regs);
        setRsvps(going);
        setLoadError(false);
      } catch (err) {
        console.error("Error loading events:", err);
        // A failed load must not read as "no events".
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [reloadKey]);

  const handlePurchase = async (eventId: string) => {
    setPurchasing(eventId);
    try {
      const { data, error } = await supabase.functions.invoke("ccbill-checkout", {
        body: { product: `event:${eventId}` },
      });
      if (data?.error === "already_registered") { toast("You already have a ticket for this event."); return; }
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.location.assign(data.url);
    } catch (err: any) {
      toast.error("We couldn't open checkout. Please try again.");
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
      toast.success("You're going!", { icon: <GuideArt name="guide-high-five" size={36} /> });
    } catch (err: any) {
      // Rollback
      setRsvps((prev) => prev.filter((id) => id !== eventId));
      toast.error(err.message?.includes("duplicate") ? "You've already RSVP'd" : "Your RSVP didn't save. Please try again.");
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
      toast.error("We couldn't cancel your RSVP. Please try again.");
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

  // Who each kind of event is for, in the words the rule actually uses.
  const tierDescriptions: Record<EventTier, string> = {
    community: "Free and open to every member.",
    premium: "For members on any plan.",
    adults_only: "For VIP members who have finished the Advanced lessons.",
  };

  const firstCardTier = (["community", "premium", "adults_only"] as EventTier[]).find((t) => events.some((e) => e.event_tier === t));
  const eventsTourSteps: TourStep[] = [
    { target: "events-tier-tabs", title: "Three kinds of events", description: "Community events are free for everyone. The other two are for members on a plan.", position: "below" },
    // Only pointed at when there is an event on the open tab to point at.
    ...(firstCardTier === activeTab ? [{ target: "events-card-first", title: "Save your spot", description: "RSVP to a free event in one tap, then add it to your calendar.", position: "below" as const }] : []),
  ];

  const renderEventList = (tier: EventTier) => {
    const filtered = tierEvents(tier);
    const access = canAccessTier(tier);

    if (loading) {
      return (
        <div className="space-y-4" aria-busy="true" aria-label="Loading events">
          {[0, 1].map((i) => (
            <div key={i} className="overflow-hidden rounded-[20px] border-2 border-border p-4">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="mt-3 h-6 w-3/4" />
              <Skeleton className="mt-3 h-4 w-1/2" />
              <Skeleton className="mt-2 h-4 w-2/5" />
              <Skeleton className="mt-4 h-11 w-28 rounded-xl" />
            </div>
          ))}
        </div>
      );
    }

    if (loadError) {
      return (
        <BrandedEmptyState
          mascot="confused"
          headline="We couldn't load events."
          description="Check your connection and try again."
          ctaLabel="Try again"
          onCtaClick={() => { setLoading(true); setReloadKey((k) => k + 1); }}
          className="py-4"
        />
      );
    }

    if (filtered.length === 0) {
      return eventSearch ? (
        <BrandedEmptyState
          mascot="confused"
          headline="No events match that search."
          description="Try a shorter word, or clear the search to see everything."
          ctaLabel="Clear search"
          onCtaClick={() => { setEventSearch(""); setSearchKey((k) => k + 1); }}
          ctaVariant="outline"
          className="py-4"
        />
      ) : (
        <BrandedEmptyState
          mascot="together"
          headline="Nothing on the calendar yet."
          description="New events are posted here first. Lessons are open any time."
          ctaLabel="Go to Learn"
          onCtaClick={() => navigate("/learn")}
          ctaVariant="outline"
          className="py-4"
        />
      );
    }

    return (
      <ul className="space-y-4">
        {filtered.map((event, i) => (
          <li key={event.id} className="kit-rise" style={{ "--i": Math.min(i, 6) } as CSSProperties} data-tour={i === 0 ? "events-card-first" : undefined}>
            <EventCard
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
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="kit-area-discover min-h-screen bg-background pb-20">
      <header className="kit-header sticky top-0 z-30">
        <div className="mx-auto flex w-full max-w-md items-center gap-1 px-2 py-1 md:max-w-2xl">
          <button type="button" className="kit-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft aria-hidden="true" />
          </button>
          <h1 className="text-xl font-extrabold">Events</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pb-6 pt-3 md:max-w-2xl">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EventTier)} className="w-full">
          <TabsList className="kit-tabs" data-tour="events-tier-tabs">
            <TabsTrigger value="community" className="kit-tab">Community</TabsTrigger>
            <TabsTrigger value="premium" className="kit-tab">Premium</TabsTrigger>
            <TabsTrigger value="adults_only" className="kit-tab">Adults Only</TabsTrigger>
          </TabsList>

          <p className="my-3 text-center text-sm text-muted-foreground [text-wrap:balance]">{tierDescriptions[activeTab]}</p>

          {/* A search box over two or three events is one more thing to read, so it appears once there is a list to search. */}
          {events.length > 3 && (
            <div className="mb-4">
              <SearchInput key={searchKey} placeholder="Search events" ariaLabel="Search events" onSearch={handleEventSearch} />
            </div>
          )}

          <TabsContent value="community" className="mt-0">{renderEventList("community")}</TabsContent>
          <TabsContent value="premium" className="mt-0">{renderEventList("premium")}</TabsContent>
          <TabsContent value="adults_only" className="mt-0">{renderEventList("adults_only")}</TabsContent>
        </Tabs>
      </main>
      <BottomNav />
      {showEventsTour && (
        <SpotlightTour
          tourKey="events_tour"
          steps={eventsTourSteps}
          onComplete={() => { setShowEventsTour(false); markEventsTourSeen(); }}
        />
      )}
    </div>
  );
};

export default Events;
