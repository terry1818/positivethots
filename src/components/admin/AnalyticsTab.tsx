import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, BarChart3, TrendingUp, Users, UserCheck, Award, CreditCard, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventStat {
  event_name: string;
  count: number;
}

interface FunnelMetrics {
  totalUsers: number;
  onboardedUsers: number;
  usersWithBadges: number;
  usersInDiscovery: number;
  paidSubscribers: number;
}

export const AnalyticsTab = () => {
  const [stats, setStats] = useState<EventStat[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [funnel, setFunnel] = useState<FunnelMetrics>({ totalUsers: 0, onboardedUsers: 0, usersWithBadges: 0, usersInDiscovery: 0, paidSubscribers: 0 });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);

    // Parallel queries for funnel metrics + event stats
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const [
      eventsResult,
      totalUsersResult,
      onboardedResult,
      badgesResult,
      swipesResult,
      subscribersResult,
    ] = await Promise.all([
      supabase.from("analytics_events").select("event_name", { count: "exact" }).gte("created_at", sevenDaysAgo),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("onboarding_completed", true),
      supabase.from("user_badges").select("id", { count: "exact", head: true }),
      supabase.from("swipes").select("id", { count: "exact", head: true }),
      supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]);

    // Process event stats
    if (eventsResult.data) {
      const counts: Record<string, number> = {};
      eventsResult.data.forEach((row: any) => {
        counts[row.event_name] = (counts[row.event_name] || 0) + 1;
      });
      const sorted = Object.entries(counts)
        .map(([event_name, count]) => ({ event_name, count }))
        .sort((a, b) => b.count - a.count);
      setStats(sorted);
      setTotalEvents(eventsResult.count || eventsResult.data.length);
    }

    // Process funnel metrics
    const totalUsers = totalUsersResult.count || 0;
    setFunnel({
      totalUsers,
      onboardedUsers: onboardedResult.count || 0,
      usersWithBadges: badgesResult.count || 0,
      usersInDiscovery: swipesResult.count || 0,
      paidSubscribers: subscribersResult.count || 0,
    });

    setLoading(false);
  };

  useEffect(() => { loadStats(); }, []);

  const onboardingRate = funnel.totalUsers > 0 ? Math.round((funnel.onboardedUsers / funnel.totalUsers) * 100) : 0;
  const conversionRate = funnel.totalUsers > 0 ? Math.round((funnel.paidSubscribers / funnel.totalUsers) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Analytics
        </h3>
        <Button variant="ghost" size="sm" onClick={loadStats} disabled={loading}>
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Funnel Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total Users</p>
              <p className="text-lg font-bold">{funnel.totalUsers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-success" />
            <div>
              <p className="text-xs text-muted-foreground">Onboarded</p>
              <p className="text-lg font-bold">{funnel.onboardedUsers} <span className="text-xs font-normal text-muted-foreground">({onboardingRate}%)</span></p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-accent" />
            <div>
              <p className="text-xs text-muted-foreground">Users w/ Badges</p>
              <p className="text-lg font-bold">{funnel.usersWithBadges}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-secondary" />
            <div>
              <p className="text-xs text-muted-foreground">Discovery (Swipes)</p>
              <p className="text-lg font-bold">{funnel.usersInDiscovery}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Paid Subscribers</p>
              <p className="text-lg font-bold">{funnel.paidSubscribers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-success" />
            <div>
              <p className="text-xs text-muted-foreground">Conversion Rate</p>
              <p className="text-lg font-bold">{conversionRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Event Stats (Last 7 Days) */}
      <h4 className="text-xs font-medium text-muted-foreground pt-2">Events (Last 7 Days) · {totalEvents} total</h4>

      {stats.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No events tracked yet</p>
      ) : (
        <div className="space-y-1.5">
          {stats.map((stat) => (
            <div key={stat.event_name} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
              <span className="text-sm">{stat.event_name.replace(/_/g, " ")}</span>
              <Badge variant="secondary">{stat.count}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
