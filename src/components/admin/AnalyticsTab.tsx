import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, BarChart3, TrendingUp, Users, UserCheck, Award, CreditCard, Percent, Target, Activity, BookOpen, GraduationCap, CheckCircle, Flame, MessageSquare } from "lucide-react";
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

interface SuccessMetrics {
  day7_retention: number;
  sessions_per_dau: number;
  module_completion: number;
  foundation_completion: number;
  quiz_pass_rate: number;
  streak_7day_rate: number;
  reflection_rate: number;
}

const TARGETS = [
  { key: "day7_retention" as const, label: "Day-7 Retention", target: 35, unit: "%", icon: Activity, description: "% users active 7d after signup" },
  { key: "sessions_per_dau" as const, label: "Sessions / DAU", target: 1.8, unit: "", icon: TrendingUp, description: "Avg sessions per active user" },
  { key: "module_completion" as const, label: "Module Completion", target: 55, unit: "%", icon: BookOpen, description: "% who start → earn badge" },
  { key: "foundation_completion" as const, label: "Foundation Complete", target: 40, unit: "%", icon: GraduationCap, description: "% users with all 5 foundation badges" },
  { key: "quiz_pass_rate" as const, label: "Quiz Pass Rate", target: 70, unit: "%", icon: CheckCircle, description: "% quiz submissions ≥ 80%" },
  { key: "streak_7day_rate" as const, label: "7-Day Streak Rate", target: 22, unit: "%", icon: Flame, description: "% active users with streak ≥ 7" },
  { key: "reflection_rate" as const, label: "Reflection Rate", target: 30, unit: "%", icon: MessageSquare, description: "% reflectable sections with response" },
];

const getStatusColor = (value: number, target: number): string => {
  const ratio = value / target;
  if (ratio >= 0.9) return "text-green-500";
  if (ratio >= 0.5) return "text-yellow-500";
  return "text-red-500";
};

const getStatusBg = (value: number, target: number): string => {
  const ratio = value / target;
  if (ratio >= 0.9) return "bg-green-500/10 border-green-500/20";
  if (ratio >= 0.5) return "bg-yellow-500/10 border-yellow-500/20";
  return "bg-red-500/10 border-red-500/20";
};

export const AnalyticsTab = () => {
  const [stats, setStats] = useState<EventStat[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [funnel, setFunnel] = useState<FunnelMetrics>({ totalUsers: 0, onboardedUsers: 0, usersWithBadges: 0, usersInDiscovery: 0, paidSubscribers: 0 });
  const [success, setSuccess] = useState<SuccessMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const [eventsResult, funnelResult, successResult] = await Promise.all([
      supabase.from("analytics_events").select("event_name", { count: "exact" }).gte("created_at", sevenDaysAgo),
      supabase.rpc("get_funnel_metrics").single(),
      supabase.rpc("get_success_metrics" as any),
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

    // Process funnel metrics from single RPC
    if (funnelResult.data) {
      const d = funnelResult.data as any;
      setFunnel({
        totalUsers: Number(d.total_users) || 0,
        onboardedUsers: Number(d.onboarded_users) || 0,
        usersWithBadges: Number(d.users_with_badges) || 0,
        usersInDiscovery: Number(d.users_in_discovery) || 0,
        paidSubscribers: Number(d.paid_subscribers) || 0,
      });
    }

    // Process success metrics
    if (successResult.data) {
      setSuccess(successResult.data as unknown as SuccessMetrics);
    }

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
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-lg font-bold">{funnel.totalUsers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Onboarded</p>
              <p className="text-lg font-bold">{funnel.onboardedUsers} <span className="text-sm font-normal text-muted-foreground">({onboardingRate}%)</span></p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Users w/ 1+ Badge</p>
              <p className="text-lg font-bold">{funnel.usersWithBadges}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-secondary" />
            <div>
              <p className="text-sm text-muted-foreground">Discovery (Swipes)</p>
              <p className="text-lg font-bold">{funnel.usersInDiscovery}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Paid Subscribers</p>
              <p className="text-lg font-bold">{funnel.paidSubscribers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-lg font-bold">{conversionRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Success Metrics */}
      <div className="flex items-center gap-2 pt-2">
        <Target className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-medium text-muted-foreground">Success Metrics (KPIs)</h4>
      </div>

      {success ? (
        <div className="grid grid-cols-2 gap-2">
          {TARGETS.map(({ key, label, target, unit, icon: Icon, description }) => {
            const value = success[key];
            return (
              <Card key={key} className={`p-3 border ${getStatusBg(value, target)}`}>
                <div className="flex items-start gap-2">
                  <Icon className={`h-4 w-4 mt-0.5 ${getStatusColor(value, target)}`} />
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground truncate">{label}</p>
                    <p className={`text-lg font-bold ${getStatusColor(value, target)}`}>
                      {value}{unit}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Target: {target}{unit} · {description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-2 text-center">Loading metrics...</p>
      )}

      {/* Event Stats (Last 7 Days) */}
      <h4 className="text-sm font-medium text-muted-foreground pt-2">Events (Last 7 Days) · {totalEvents} total</h4>

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
