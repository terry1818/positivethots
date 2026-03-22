import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, BarChart3, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventStat {
  event_name: string;
  count: number;
}

export const AnalyticsTab = () => {
  const [stats, setStats] = useState<EventStat[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    // Get event counts grouped by name (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data, count } = await supabase
      .from("analytics_events")
      .select("event_name", { count: "exact" })
      .gte("created_at", sevenDaysAgo);

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((row: any) => {
        counts[row.event_name] = (counts[row.event_name] || 0) + 1;
      });
      const sorted = Object.entries(counts)
        .map(([event_name, count]) => ({ event_name, count }))
        .sort((a, b) => b.count - a.count);
      setStats(sorted);
      setTotalEvents(count || data.length);
    }
    setLoading(false);
  };

  useEffect(() => { loadStats(); }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Analytics (Last 7 Days)
        </h3>
        <Button variant="ghost" size="sm" onClick={loadStats} disabled={loading}>
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total Events</p>
              <p className="text-lg font-bold">{totalEvents}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-secondary" />
            <div>
              <p className="text-xs text-muted-foreground">Event Types</p>
              <p className="text-lg font-bold">{stats.length}</p>
            </div>
          </div>
        </Card>
      </div>

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
