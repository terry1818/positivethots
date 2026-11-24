import { Button } from "@/components/ui/button";
import { Calendar, Check, Clock, Globe, Loader2, MapPin, Ticket, Users, Video } from "lucide-react";
import { format } from "date-fns";
import { PAYMENTS_OPEN } from "@/lib/payments";

export interface EventData {
  id: string;
  title: string;
  description: string | null;
  host_name: string;
  event_date: string;
  price_cents: number;
  capacity: number;
  image_url: string | null;
  is_active: boolean;
  event_tier: string;
  event_format: string | null;
  location_name: string | null;
  location_address: string | null;
}

interface EventCardProps {
  event: EventData;
  isRegistered: boolean;
  isRsvpd: boolean;
  canAccess: boolean;
  accessReason?: string;
  isVIP: boolean;
  purchasing: string | null;
  rsvpLoading: string | null;
  onPurchase: (eventId: string) => void;
  onRsvp: (eventId: string) => void;
  onCancelRsvp: (eventId: string) => void;
  onAddToCalendar: (event: EventData) => void;
  onUpgrade: () => void;
  onLearn: () => void;
}

const PlaceIcon = ({ kind }: { kind: string | null }) =>
  kind === "virtual" ? <Video aria-hidden="true" /> : kind === "hybrid" ? <Globe aria-hidden="true" /> : <MapPin aria-hidden="true" />;

const placeWord = (kind: string | null) => (kind === "virtual" ? "Online" : kind === "hybrid" ? "In person and online" : null);

const TierChip = ({ tier }: { tier: string }) =>
  tier === "premium" ? <span className="kit-chip">Premium</span>
    : tier === "adults_only" ? <span className="kit-chip" data-tone="area">Adults Only</span>
    : <span className="kit-chip" data-tone="quiet">Community</span>;

export const EventCard = ({
  event, isRegistered, isRsvpd, canAccess, accessReason, isVIP,
  purchasing, rsvpLoading, onPurchase, onRsvp, onCancelRsvp, onAddToCalendar, onUpgrade, onLearn,
}: EventCardProps) => {
  const isFree = event.price_cents === 0;
  const priceFormatted = (event.price_cents / 100).toFixed(2);
  const discountedPrice = isVIP && !isFree ? ((event.price_cents * 0.75) / 100).toFixed(2) : null;
  const eventDate = new Date(event.event_date);
  const isPast = eventDate < new Date();
  const going = isRegistered || isRsvpd;
  const place = [placeWord(event.event_format), event.location_name || event.host_name].filter(Boolean).join(" · ");

  return (
    <article className="kit-card event-card" aria-label={event.title}>
      {event.image_url && (
        <div className="event-photo">
          <img src={event.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <TierChip tier={event.event_tier} />
          {going && (
            <span className="kit-chip" data-tone="correct"><Check className="h-3.5 w-3.5" aria-hidden="true" /> You're going</span>
          )}
        </div>
        <h3 className="text-lg font-extrabold leading-tight [text-wrap:balance]">{event.title}</h3>
        <ul className="event-meta">
          <li><Clock aria-hidden="true" /><span>{format(eventDate, "EEE, MMM d · h:mm a")}</span></li>
          <li><PlaceIcon kind={event.event_format} /><span>{place}</span></li>
          <li><Users aria-hidden="true" /><span>Room for {event.capacity}</span></li>
        </ul>
        {event.description && (
          <p className="line-clamp-3 text-sm text-muted-foreground [text-wrap:pretty]">{event.description}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-1">
          <p className="flex items-baseline gap-2">
            {isFree ? (
              <span className="kit-text text-lg font-extrabold">Free</span>
            ) : discountedPrice ? (
              <>
                <span className="kit-text text-lg font-extrabold tabular-nums">${discountedPrice}</span>
                <span className="text-sm text-muted-foreground line-through tabular-nums">${priceFormatted}</span>
              </>
            ) : (
              <span className="text-lg font-extrabold tabular-nums">${priceFormatted}</span>
            )}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            {canAccess ? (
              <>
                {going && (
                  <Button variant="outline" className="min-h-[44px] font-bold" onClick={() => onAddToCalendar(event)}>
                    <Calendar className="mr-1 h-4 w-4" aria-hidden="true" /> Add to calendar
                  </Button>
                )}
                {isRsvpd && !isRegistered && (
                  <Button variant="ghost" className="min-h-[44px] font-bold" onClick={() => onCancelRsvp(event.id)} disabled={rsvpLoading !== null}>
                    Cancel RSVP
                  </Button>
                )}
                {!going && !isPast && isFree && (
                  <Button className="min-h-[44px] px-6 font-bold" onClick={() => onRsvp(event.id)} disabled={rsvpLoading !== null}>
                    {rsvpLoading === event.id ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Saving" /> : "RSVP"}
                  </Button>
                )}
                {!going && !isPast && !isFree && (PAYMENTS_OPEN ? (
                  <Button className="min-h-[44px] px-5 font-bold" onClick={() => onPurchase(event.id)} disabled={purchasing !== null}>
                    {purchasing === event.id ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Opening checkout" /> : <><Ticket className="mr-1 h-4 w-4" aria-hidden="true" /> Get ticket</>}
                  </Button>
                ) : (
                  <span className="plan-soon"><Clock className="h-4 w-4" aria-hidden="true" /> Tickets open soon</span>
                ))}
              </>
            ) : accessReason === "education" ? (
              <Button variant="outline" className="min-h-[44px] font-bold" onClick={onLearn}>Finish the lessons</Button>
            ) : (
              <Button variant="outline" className="min-h-[44px] font-bold" onClick={onUpgrade}>
                {accessReason === "premium" ? "See plans" : "VIP plan needed"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
