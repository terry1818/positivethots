import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLoader } from "@/components/PageLoader";
import { Logo } from "@/components/Logo";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  BarChart3, Users, MessageSquare, Heart, Crown, Shield, TrendingUp, TrendingDown,
  Search, ChevronLeft, ChevronRight, AlertTriangle, Megaphone, BookOpen,
  Calendar, Link2, Eye, UserX, UserCheck, Trash2, Loader2, ArrowLeft,
  Send, Flag, CheckCircle, XCircle, ClipboardList, HeartPulse, UserPlus
} from "lucide-react";
import { DemoAccountButton, DemoBadge } from "@/components/admin/DemoAccountManager";
import { EducationConsistencyDashboard } from "@/components/admin/EducationConsistencyDashboard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

// ─── Helpers ────────────────────────────────────────────────
const relativeTime = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const SectionError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center gap-3 py-8">
    <AlertTriangle className="h-8 w-8 text-muted-foreground" />
    <p className="text-sm text-muted-foreground">Oops! Couldn't load this section.</p>
    <Button variant="outline" onClick={onRetry} className="min-h-[44px]">Retry</Button>
  </div>
);

const SectionEmpty = ({ message }: { message: string }) => (
  <p className="text-center text-sm py-8" style={{ color: "rgba(255,255,255,0.6)" }}>{message}</p>
);

const SkeletonCards = ({ count, className }: { count: number; className?: string }) => (
  <div className={cn("space-y-3", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="h-20 w-full" />
    ))}
  </div>
);

const SkeletonGrid = ({ count }: { count: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="h-24 w-full" />
    ))}
  </div>
);

// ─── Audit Log Helper ───────────────────────────────────────
const useAuditLog = () => {
  const logAction = useCallback(async (action: string, targetUserId?: string, details?: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("audit_log").insert({
      admin_user_id: user.id,
      action,
      target_user_id: targetUserId || null,
      details: details || {},
    });
  }, []);
  return { logAction };
};

// ─── Overview Tab ───────────────────────────────────────────
const OverviewTab = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentAudit, setRecentAudit] = useState<any[]>([]);
  const reducedMotion = useReducedMotion();

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [statsRes, auditRes] = await Promise.all([
        supabase.rpc("get_admin_dashboard_stats"),
        supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(20),
      ]);
      if (statsRes.error) throw statsRes.error;
      setStats(statsRes.data);
      setRecentAudit(auditRes.data || []);

      // Build 30-day signup chart from profiles created_at
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: signups } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at");

      const dayMap: Record<string, number> = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - 29 + i);
        dayMap[d.toISOString().split("T")[0]] = 0;
      }
      signups?.forEach(s => {
        const day = s.created_at.split("T")[0];
        if (dayMap[day] !== undefined) dayMap[day]++;
      });
      setChartData(Object.entries(dayMap).map(([date, count]) => ({
        date: `${parseInt(date.split("-")[1])}/${parseInt(date.split("-")[2])}`,
        signups: count,
      })));
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <><SkeletonGrid count={9} /><Skeleton className="h-[200px] md:h-[250px] w-full mt-4" /></>;
  if (error) return <SectionError onRetry={fetchData} />;
  if (!stats) return <SectionEmpty message="No stats available yet." />;

  const kpis = [
    { label: "TOTAL USERS", value: stats.total_users, icon: Users, color: "text-primary" },
    { label: "NEW (7D)", value: stats.new_users_7d, icon: TrendingUp, color: "text-green-500",
      trend: stats.prev_new_users_7d > 0 ? Math.round(((stats.new_users_7d - stats.prev_new_users_7d) / stats.prev_new_users_7d) * 100) : null },
    { label: "NEW (30D)", value: stats.new_users_30d, icon: TrendingUp, color: "text-green-400" },
    { label: "MATCHES", value: stats.total_matches, icon: Heart, color: "text-pink-500",
      trend: stats.prev_matches_7d > 0 ? Math.round(((stats.matches_7d - stats.prev_matches_7d) / stats.prev_matches_7d) * 100) : null },
    { label: "MESSAGES (7D)", value: stats.messages_7d || 0, icon: MessageSquare, color: "text-blue-400",
      trend: stats.prev_messages_7d > 0 ? Math.round(((stats.messages_7d - stats.prev_messages_7d) / stats.prev_messages_7d) * 100) : null },
    { label: "PREMIUM", value: stats.active_subscribers, icon: Crown, color: "text-yellow-500" },
    { label: "DAU", value: stats.dau, icon: Users, color: "text-emerald-500" },
    { label: "WAU", value: stats.wau, icon: Users, color: "text-emerald-400" },
    { label: "OPEN REPORTS", value: stats.open_reports, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="bg-card/60" aria-label={`${k.label}: ${k.value?.toLocaleString() ?? 0}${k.trend != null ? `, ${k.trend >= 0 ? 'up' : 'down'} ${Math.abs(k.trend)}% from last period` : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <k.icon className={cn("h-4 w-4", k.color)} />
                <span className="text-[12px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>{k.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] font-bold leading-none">{k.value?.toLocaleString() ?? 0}</span>
                {k.trend != null ? (
                  <span className={cn("text-xs flex items-center gap-0.5", k.trend >= 0 ? "text-[#22C55E]" : "text-[#EF4444]")}>
                    {k.trend >= 0 ? "↑" : "↓"}{Math.abs(k.trend)}%
                  </span>
                ) : k.label !== "OPEN REPORTS" && k.label !== "TOTAL USERS" ? (
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>--</span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Signup Chart */}
      <Card className="bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>New User Signups (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 200 : 250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13 }}
                  labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                />
                <Line type="monotone" dataKey="signups" stroke="#7C3AED" strokeWidth={2} dot={false}
                  isAnimationActive={!reducedMotion} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <SectionEmpty message="No signup data available yet." />
          )}
        </CardContent>
      </Card>

      {/* Recent Audit Log */}
      <Card className="bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: "rgba(255,255,255,0.6)" }}>
            <ClipboardList className="h-4 w-4" /> Recent Admin Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentAudit.length === 0 ? (
            <SectionEmpty message="No admin actions recorded yet." />
          ) : (
            <div className="space-y-1.5">
              {recentAudit.slice(0, 20).map(l => (
                <div key={l.id} className="flex items-center justify-between text-sm py-1">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">{l.action.replace(/_/g, " ")}</span>
                    {l.target_user_id && (
                      <span className="ml-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                        → {l.target_user_id.slice(0, 8)}…
                      </span>
                    )}
                  </div>
                  <span className="text-xs shrink-0 ml-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {relativeTime(l.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── User Management Tab ────────────────────────────────────
const UserManagementTab = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteStep, setDeleteStep] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { logAction } = useAuditLog();
  const perPage = 20;

  const [demoUserIds, setDemoUserIds] = useState<Set<string>>(new Set());

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [{ data: authData }, usersRes, demoRes] = await Promise.all([
        supabase.auth.getUser(),
        supabase.rpc("get_admin_user_list", {
          _search: search, _filter: filter, _page: page, _per_page: perPage,
        }),
        supabase.from("audit_log").select("target_user_id").eq("action", "create_demo_account"),
      ]);
      if (usersRes.error) throw usersRes.error;
      const d = usersRes.data as any;
      setCurrentUserId(authData.user?.id ?? null);
      setUsers(d.users || []);
      setTotal(d.total || 0);
      setDemoUserIds(new Set((demoRes.data || []).map((r: any) => r.target_user_id).filter(Boolean)));
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [search, filter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const doSearch = () => { setPage(1); fetchUsers(); };

  const toggleAdmin = async (u: any) => {
    setActionLoading(u.id);
    try {
      if (u.is_admin) {
        await supabase.rpc("revoke_role", { _target_user_id: u.id, _role: "admin" });
        await logAction("revoke_admin", u.id, { name: u.display_name || u.name });
        toast.success(`Admin role revoked from ${u.display_name || u.name}`);
      } else {
        await supabase.rpc("grant_role", { _target_user_id: u.id, _role: "admin" });
        await logAction("grant_admin", u.id, { name: u.display_name || u.name });
        toast.success(`Admin role granted to ${u.display_name || u.name}`);
      }
      fetchUsers();
    } catch (e: any) {
      toast.error(`Failed to toggle admin — tap to retry`);
    }
    setActionLoading(null);
  };

  const togglePremium = async (u: any) => {
    setActionLoading(u.id);
    try {
      if (u.is_premium) {
        await supabase.from("subscriptions").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("user_id", u.id);
        await logAction("revoke_premium", u.id, { name: u.display_name || u.name });
        toast.success(`Premium revoked from ${u.display_name || u.name}`);
      } else {
        await supabase.from("subscriptions").upsert({
          user_id: u.id, status: "active", plan: "premium", current_period_end: null,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        await logAction("grant_premium", u.id, { name: u.display_name || u.name });
        toast.success(`Premium granted to ${u.display_name || u.name}`);
      }
      fetchUsers();
    } catch {
      toast.error("Failed to toggle premium — tap to retry");
    }
    setActionLoading(null);
  };

  const suspendUser = async (u: any, suspend: boolean) => {
    setActionLoading(u.id);
    try {
      const { error: err } = await supabase.rpc("admin_suspend_user", { _target_user_id: u.id, _suspend: suspend });
      if (err) throw err;
      await logAction(suspend ? "suspend_user" : "unsuspend_user", u.id, { name: u.display_name || u.name });
      toast.success(suspend ? `${u.display_name || u.name} has been suspended` : `${u.display_name || u.name} has been unsuspended`);
      fetchUsers();
    } catch {
      toast.error("Failed — tap to retry");
    }
    setActionLoading(null);
  };

  const deleteUser = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.id === currentUserId) {
      toast.error("Use Account Settings to delete your own account.");
      setDeleteTarget(null);
      setDeleteStep(0);
      setDeleteConfirmText("");
      return;
    }

    setActionLoading(deleteTarget.id);
    try {
      await logAction("delete_user", deleteTarget.id, { name: deleteTarget.display_name || deleteTarget.name });
      const { error: err } = await supabase.functions.invoke("manage-account", {
        body: { action: "delete", targetUserId: deleteTarget.id },
      });
      if (err) throw err;
      toast.success(`${deleteTarget.display_name || deleteTarget.name}'s account has been deleted`);
      setDeleteTarget(null);
      setDeleteStep(0);
      setDeleteConfirmText("");
      fetchUsers();
    } catch {
      toast.error("Failed to delete user — tap to retry");
    }
    setActionLoading(null);
  };

  const totalPages = Math.ceil(total / perPage);
  const name = (u: any) => u.display_name || u.name || "Unknown";
  const isSuspended = (u: any) => u.is_suspended || u.churn_status === "suspended";

  if (loading) return <SkeletonCards count={5} />;
  if (error) return <SectionError onRetry={fetchUsers} />;

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex gap-2">
          <Input placeholder="Search by name…" value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doSearch()} className="flex-1" />
          <Button onClick={doSearch} className="min-h-[44px] min-w-[44px]" size="icon" aria-label="Search users">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Select value={filter} onValueChange={v => { setFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px] min-h-[44px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="new">New (7d)</SelectItem>
          </SelectContent>
        </Select>
        <DemoAccountButton onRefresh={fetchUsers} />
      </div>

      {/* Desktop Table (md+) */}
      <div className="hidden md:block rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-medium">User</th>
              <th className="text-left p-3 font-medium">Joined</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Last Active</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={5}><SectionEmpty message="No users match those filters. Try broadening your search." /></td></tr>
            ) : users.map((u: any) => (
              <tr key={u.id} className="border-b hover:bg-muted/20">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u.profile_image} />
                      <AvatarFallback>{name(u)[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{name(u)}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {demoUserIds.has(u.id) && <DemoBadge />}
                    {u.is_admin && <Badge className="text-[10px] px-1.5 bg-primary text-primary-foreground">Admin</Badge>}
                    {u.is_premium && <Badge className="text-[10px] px-1.5 bg-yellow-600 text-yellow-50">Premium</Badge>}
                    {u.is_verified && <Badge className="text-[10px] px-1.5 bg-green-600 text-white">Verified</Badge>}
                    {isSuspended(u) && <Badge className="text-[10px] px-1.5 bg-[#DC2626] text-[#1A1A1A] font-semibold">Suspended</Badge>}
                  </div>
                </td>
                <td className="p-3 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{u.last_active_at ? relativeTime(u.last_active_at) : "Never"}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant={u.is_admin ? "destructive" : "outline"} className="min-h-[44px] min-w-[44px]"
                      disabled={actionLoading === u.id} onClick={() => toggleAdmin(u)}
                      aria-label={`${u.is_admin ? "Revoke" : "Grant"} admin role for ${name(u)}`}>
                      <Shield className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant={u.is_premium ? "destructive" : "outline"} className="min-h-[44px] min-w-[44px]"
                      disabled={actionLoading === u.id} onClick={() => togglePremium(u)}
                      aria-label={`${u.is_premium ? "Revoke" : "Grant"} premium for ${name(u)}`}>
                      <Crown className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" className="min-h-[44px] min-w-[44px]"
                      disabled={actionLoading === u.id} onClick={() => suspendUser(u, !isSuspended(u))}
                      aria-label={`${isSuspended(u) ? "Unsuspend" : "Suspend"} ${name(u)}`}>
                      {isSuspended(u) ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="destructive" className="min-h-[44px] min-w-[44px]"
                      disabled={actionLoading === u.id || u.id === currentUserId}
                      onClick={() => { setDeleteTarget(u); setDeleteStep(1); }}
                      aria-label={u.id === currentUserId ? `You can't delete your own account here` : `Delete account for ${name(u)}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards (<md) */}
      <div className="md:hidden space-y-2">
        {users.length === 0 ? (
          <SectionEmpty message="No users match those filters. Try broadening your search." />
        ) : users.map((u: any) => (
          <Card key={u.id} className="bg-[#1A1A1A] rounded-xl">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={u.profile_image} />
                  <AvatarFallback>{name(u)[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium truncate">{name(u)}</span>
                    {demoUserIds.has(u.id) && <DemoBadge />}
                    {u.is_admin && <Badge className="text-[10px] px-1.5 bg-primary text-primary-foreground">Admin</Badge>}
                    {u.is_premium && <Badge className="text-[10px] px-1.5 bg-yellow-600 text-yellow-50">VIP</Badge>}
                    {isSuspended(u) && <Badge className="text-[10px] px-1.5 bg-[#DC2626] text-[#1A1A1A] font-semibold">Suspended</Badge>}
                  </div>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                    Joined: {new Date(u.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })} | Active: {u.last_active_at ? relativeTime(u.last_active_at) : "Never"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="icon" variant={u.is_admin ? "destructive" : "outline"} className="min-h-[44px] min-w-[44px]"
                  disabled={actionLoading === u.id} onClick={() => toggleAdmin(u)}
                  aria-label={`${u.is_admin ? "Revoke" : "Grant"} admin for ${name(u)}`}>
                  <Shield className="h-4 w-4" />
                </Button>
                <Button size="icon" variant={u.is_premium ? "destructive" : "outline"} className="min-h-[44px] min-w-[44px]"
                  disabled={actionLoading === u.id} onClick={() => togglePremium(u)}
                  aria-label={`${u.is_premium ? "Revoke" : "Grant"} premium for ${name(u)}`}>
                  <Crown className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" className="min-h-[44px] min-w-[44px]"
                  disabled={actionLoading === u.id} onClick={() => suspendUser(u, !isSuspended(u))}
                  aria-label={`${isSuspended(u) ? "Unsuspend" : "Suspend"} ${name(u)}`}>
                  {isSuspended(u) ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="destructive" className="min-h-[44px] min-w-[44px]"
                  disabled={actionLoading === u.id || u.id === currentUserId}
                  onClick={() => { setDeleteTarget(u); setDeleteStep(1); }}
                  aria-label={u.id === currentUserId ? `You can't delete your own account here` : `Delete account for ${name(u)}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{total} user{total !== 1 ? "s" : ""}</span>
        <div className="flex gap-1">
          <Button size="icon" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="min-h-[44px] min-w-[44px]"
            aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2 py-1 flex items-center">{page}/{totalPages || 1}</span>
          <Button size="icon" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="min-h-[44px] min-w-[44px]"
            aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Double Confirmation */}
      <Dialog open={deleteStep === 1} onOpenChange={open => { if (!open) { setDeleteStep(0); setDeleteTarget(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget && name(deleteTarget)}'s account?</DialogTitle>
            <DialogDescription>This action is permanent and cannot be undone. All their data will be removed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteStep(0); setDeleteTarget(null); }} className="min-h-[44px]">Cancel</Button>
            <Button variant="destructive" onClick={() => setDeleteStep(2)} className="min-h-[44px]">Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteStep === 2} onOpenChange={open => { if (!open) { setDeleteStep(0); setDeleteTarget(null); setDeleteConfirmText(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Type DELETE to confirm</DialogTitle>
            <DialogDescription>This will permanently delete {deleteTarget && name(deleteTarget)}'s account.</DialogDescription>
          </DialogHeader>
          <Input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="Type DELETE" className="mt-2" />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteStep(0); setDeleteTarget(null); setDeleteConfirmText(""); }} className="min-h-[44px]">Cancel</Button>
            <Button variant="destructive" disabled={deleteConfirmText !== "DELETE" || actionLoading === deleteTarget?.id}
              onClick={deleteUser} className="min-h-[44px]">
              {actionLoading === deleteTarget?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Content Management Tab ─────────────────────────────────
const ContentManagementTab = () => {
  const [modules, setModules] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState("modules");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { logAction } = useAuditLog();

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [mods, evts] = await Promise.all([
        supabase.from("education_modules").select("id, title, slug, description, tier, order_index, is_required, is_optional").order("order_index"),
        supabase.from("events").select("*").order("event_date", { ascending: false }).limit(50),
      ]);
      setModules(mods.data || []);
      setEvents(evts.data || []);
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleModuleRequired = async (id: string, current: boolean) => {
    await supabase.from("education_modules").update({ is_required: !current }).eq("id", id);
    setModules(prev => prev.map(m => m.id === id ? { ...m, is_required: !current } : m));
    await logAction("toggle_module_status", undefined, { module_id: id, new_status: !current ? "published" : "draft" });
    toast.success(`Module ${!current ? "published" : "set to draft"}`);
  };

  const toggleEventActive = async (id: string, current: boolean) => {
    await supabase.from("events").update({ is_active: !current }).eq("id", id);
    setEvents(prev => prev.map(e => e.id === id ? { ...e, is_active: !current } : e));
    toast.success(`Event ${!current ? "activated" : "deactivated"}`);
  };

  if (loading) return <SkeletonCards count={3} />;
  if (error) return <SectionError onRetry={fetchData} />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["modules", "events"].map(t => (
          <Button key={t} size="sm" variant={activeSubTab === t ? "default" : "outline"}
            onClick={() => setActiveSubTab(t)} className="capitalize min-h-[44px]">
            {t === "modules" && <BookOpen className="h-3 w-3 mr-1" />}
            {t === "events" && <Calendar className="h-3 w-3 mr-1" />}
            {t}
          </Button>
        ))}
      </div>

      {activeSubTab === "modules" && (
        <div className="space-y-2">
          {modules.length === 0 ? <SectionEmpty message="No education modules found." /> : modules.map(m => (
            <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/60">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{m.title}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{m.tier} · {m.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={m.is_required ? "default" : "secondary"} className="text-[10px]">
                  {m.is_required ? "Published" : "Draft"}
                </Badge>
                <Switch checked={m.is_required} onCheckedChange={() => toggleModuleRequired(m.id, m.is_required)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === "events" && (
        <div className="space-y-2">
          {events.length === 0 ? <SectionEmpty message="No upcoming events. Create one!" /> : events.map(e => (
            <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/60">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{e.title}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{new Date(e.event_date).toLocaleDateString()} · {e.host_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={e.is_active ? "default" : "secondary"} className="text-[10px]">
                  {e.is_active ? "Active" : "Inactive"}
                </Badge>
                <Switch checked={e.is_active} onCheckedChange={() => toggleEventActive(e.id, e.is_active)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Reports Tab ────────────────────────────────────────────
const ReportsTab = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { logAction } = useAuditLog();

  const fetchReports = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data, error: err } = await supabase
        .from("flagged_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (err) throw err;
      setReports(data || []);
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const resolveReport = async (id: string, status: string) => {
    setActionLoading(id);
    await supabase.from("flagged_messages").update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: (await supabase.auth.getUser()).data.user?.id,
    }).eq("id", id);
    const report = reports.find(r => r.id === id);
    await logAction(`report_${status}`, report?.sender_id, { report_id: id });
    toast.success(`Report ${status === "dismissed" ? "dismissed" : "action taken"}`);
    fetchReports();
    setActionLoading(null);
  };

  if (loading) return <SkeletonCards count={3} />;
  if (error) return <SectionError onRetry={fetchReports} />;

  return (
    <div className="space-y-3">
      {reports.length === 0 ? (
        <SectionEmpty message="No pending reports — your community is being excellent!" />
      ) : reports.map(r => (
        <Card key={r.id} className="bg-card/60">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Flag className="h-3 w-3 text-destructive" />
                  <Badge variant={r.status === "pending" ? "destructive" : "secondary"} className="text-[10px]">{r.status}</Badge>
                </div>
                <p className="text-sm font-medium">{r.reason || r.content}</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              {r.status === "pending" && (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="min-h-[44px] text-xs" disabled={actionLoading === r.id}
                    onClick={() => resolveReport(r.id, "dismissed")}>
                    <XCircle className="h-3 w-3 mr-1" />Dismiss
                  </Button>
                  <Button size="sm" variant="destructive" className="min-h-[44px] text-xs" disabled={actionLoading === r.id}
                    onClick={() => resolveReport(r.id, "action_taken")}>
                    <CheckCircle className="h-3 w-3 mr-1" />Act
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ─── Announcements Tab ──────────────────────────────────────
const AnnouncementsTab = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all");
  const [priority, setPriority] = useState("normal");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { logAction } = useAuditLog();

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data, error: err } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(50);
      if (err) throw err;
      setAnnouncements(data || []);
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const sendAnnouncement = async () => {
    if (!message.trim()) return;
    setSending(true);
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { error: err } = await supabase.from("announcements").insert({
      title: title.trim() || null,
      message: message.trim(),
      target_audience: audience,
      priority,
      created_by: userId!,
    });
    if (err) {
      toast.error("Failed to send announcement");
    } else {
      await logAction("create_announcement", undefined, { title: title.trim(), audience, priority });
      toast.success("Announcement published");
      setTitle("");
      setMessage("");
      fetchAnnouncements();
    }
    setSending(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("announcements").update({ is_active: !current }).eq("id", id);
    await logAction("update_announcement", undefined, { announcement_id: id, is_active: !current });
    fetchAnnouncements();
  };

  if (error) return <SectionError onRetry={fetchAnnouncements} />;

  return (
    <div className="space-y-4">
      <Card className="bg-card/60">
        <CardContent className="p-4 space-y-3">
          <Input placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} maxLength={100} />
          <Textarea placeholder="Write an announcement…" value={message} onChange={e => setMessage(e.target.value)} rows={3} maxLength={500} />
          <div className="flex flex-wrap items-center gap-2">
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger className="w-[130px] min-h-[44px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="premium">Premium Only</SelectItem>
                <SelectItem value="free">Free Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-[120px] min-h-[44px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={sendAnnouncement} disabled={sending || !message.trim()} className="min-h-[44px]">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? <SkeletonCards count={2} /> : (
        <div className="space-y-2">
          {announcements.length === 0 ? (
            <SectionEmpty message="No active announcements. Create one to reach your users." />
          ) : announcements.map(a => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/60">
              <div className="min-w-0 flex-1">
                {a.title && <p className="text-sm font-medium">{a.title}</p>}
                <p className="text-sm">{a.message}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {new Date(a.created_at).toLocaleDateString()} · {a.target_audience} · {a.priority}
                </p>
              </div>
              <Switch checked={a.is_active} onCheckedChange={() => toggleActive(a.id, a.is_active)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Audit Log Tab ──────────────────────────────────────────
const AuditLogTab = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data, error: err } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(200);
      if (err) throw err;
      setLogs(data || []);
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  if (loading) return <SkeletonCards count={5} />;
  if (error) return <SectionError onRetry={fetchLogs} />;

  return (
    <div className="space-y-2">
      {logs.length === 0 ? (
        <SectionEmpty message="No admin actions recorded yet." />
      ) : logs.map(l => (
        <div key={l.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/60 text-sm">
          <div className="min-w-0 flex-1">
            <span className="font-medium">{l.action.replace(/_/g, " ")}</span>
            {l.target_user_id && <span className="ml-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>→ {l.target_user_id.slice(0, 8)}…</span>}
            {l.details && Object.keys(l.details).length > 0 && l.details.name && (
              <span className="ml-1 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>({l.details.name})</span>
            )}
          </div>
          <span className="text-xs shrink-0 ml-2" style={{ color: "rgba(255,255,255,0.5)" }}>{relativeTime(l.created_at)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Admin Page ────────────────────────────────────────
const Admin = () => {
  const { isAdmin, loading } = useAdminRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/", { replace: true });
  }, [loading, isAdmin, navigate]);

  if (loading) return <PageLoader />;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="shrink-0 min-h-[44px] min-w-[44px]"
            aria-label="Back to settings">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Logo size="sm" />
          <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
            <Shield className="h-3 w-3 mr-1" /> Admin
          </Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-4">
        <Tabs defaultValue="overview">
          <TabsList className="w-full flex overflow-x-auto scrollbar-hide h-auto gap-1" role="tablist">
            {[
              { value: "overview", icon: BarChart3, label: "Overview" },
              { value: "users", icon: Users, label: "Users" },
              { value: "content", icon: BookOpen, label: "Content" },
              { value: "reports", icon: Flag, label: "Reports" },
              { value: "announcements", icon: Megaphone, label: "Announce" },
              { value: "audit", icon: ClipboardList, label: "Audit" },
              { value: "edu-health", icon: HeartPulse, label: "Edu Health" },
            ].map(t => (
              <TabsTrigger key={t.value} value={t.value} role="tab"
                className="text-xs gap-1 flex-1 min-w-[70px] min-h-[44px]">
                <t.icon className="h-3 w-3" /> <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.label.slice(0, 4)}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-4">
            <TabsContent value="overview"><OverviewTab /></TabsContent>
            <TabsContent value="users"><UserManagementTab /></TabsContent>
            <TabsContent value="content"><ContentManagementTab /></TabsContent>
            <TabsContent value="reports"><ReportsTab /></TabsContent>
            <TabsContent value="announcements"><AnnouncementsTab /></TabsContent>
            <TabsContent value="audit"><AuditLogTab /></TabsContent>
            <TabsContent value="edu-health"><EducationConsistencyDashboard /></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
