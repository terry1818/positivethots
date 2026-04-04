import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Loader2, Users, Ticket, Crown, MapPin, Clock, Video, Globe } from "lucide-react";
import { format } from "date-fns";

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

const formatIcon = (format: string | null) => {
  if (format === "virtual") return <Video className="h-3 w-3" />;
  if (format === "hybrid") return <Globe className="h-3 w-3" />;
  return <MapPin className="h-3 w-3" />;
};

const tierBadge = (tier: string) => {
  if (tier === "premium") return <Badge variant="secondary" className="text-xs bg-accent text-accent-foreground border-accent"><Crown className="h-3 w-3 mr-1" />Premium</Badge>;
  if (tier === "adults_only") return <Badge variant="secondary" className="text-xs bg-destructive/10 text-destructive border-destructive/20">🔒 Adults Only</Badge>;
  return <Badge variant="secondary" className="text-xs">Community</Badge>;
};

export const EventCard = ({
  event, isRegistered, isRsvpd, canAccess, accessReason, isVIP,
  purchasing, rsvpLoading, onPurchase, onRsvp, onCancelRsvp, onAddToCalendar, onUpgrade, onLearn,
}: EventCardProps) => {
  const isFree = event.price_cents === 0;
  const priceFormatted = (event.price_cents / 100).toFixed(2);
  const discountedPrice = isVIP && !isFree ? ((event.price_cents * 0.75) / 100).toFixed(2) : null;
  const eventDate = new Date(event.event_date);
  const isPast = eventDate < new Date();
  const hasRsvpOrRegistration = isRegistered || isRsvpd;

  return (
    <Card className="overflow-hidden transition-all hover:-translate-y-0.5">
      {event.image_url && (
        <div className="h-40 overflow-hidden relative">
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute top-2 right-2">{tierBadge(event.event_tier)}</div>
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{event.title}</CardTitle>
          {!event.image_url && tierBadge(event.event_tier)}
          {hasRsvpOrRegistration && (
            <Badge className="bg-primary text-primary-foreground shrink-0">
              {isRsvpd ? "RSVP'd" : "Registered"}
            </Badge>
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
            {formatIcon(event.event_format)}
            {event.location_name || event.host_name}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {event.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            {isFree ? (
              <span className="text-lg font-bold text-primary">Free</span>
            ) : discountedPrice ? (
              <>
                <span className="text-lg font-bold text-primary">${discountedPrice}</span>
                <span className="text-sm text-muted-foreground line-through">${priceFormatted}</span>
              </>
            ) : (
              <span className="text-lg font-bold">${priceFormatted}</span>
            )}
          </div>
          <div className="flex gap-2">
            {canAccess ? (
              <>
                {hasRsvpOrRegistration && (
                  <Button variant="outline" size="sm" onClick={() => onAddToCalendar(event)}>
                    <Calendar className="h-4 w-4 mr-1" /> Calendar
                  </Button>
                )}
                {isRsvpd && !isRegistered && (
                  <Button variant="ghost" size="sm" onClick={() => onCancelRsvp(event.id)} disabled={rsvpLoading !== null}>
                    Cancel
                  </Button>
                )}
                {!hasRsvpOrRegistration && !isPast && isFree && (
                  <Button size="sm" onClick={() => onRsvp(event.id)} disabled={rsvpLoading !== null}>
                    {rsvpLoading === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "RSVP Free"}
                  </Button>
                )}
                {!hasRsvpOrRegistration && !isPast && !isFree && (
                  <Button size="sm" onClick={() => onPurchase(event.id)} disabled={purchasing !== null}>
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
                {accessReason === "education" ? (
                  <Button size="sm" variant="outline" onClick={onLearn}>
                    🎓 Complete Curriculum
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={onUpgrade}>
                    <Crown className="h-4 w-4 mr-1" /> {accessReason === "premium" ? "Upgrade" : "VIP Required"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
