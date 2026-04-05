import { useState, useEffect } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageLoader } from "@/components/PageLoader";
import { Logo } from "@/components/Logo";
import {
  BarChart3, Users, MessageSquare, Heart, Crown, Shield, TrendingUp, TrendingDown,
  Search, ChevronLeft, ChevronRight, AlertTriangle, Megaphone, BookOpen,
  Calendar, Link2, Eye, UserX, UserCheck, Trash2, Loader2, ArrowLeft,
  Send, Flag, CheckCircle, XCircle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ─── Overview Tab ───────────────────────────────────────────
const OverviewTab = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("get_admin_dashboard_stats");
      if (!error && data) setStats(data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!stats) return <p className="text-muted-foreground text-center py-8">Failed to load stats</p>;

  const kpis = [
    { label: "Total Users", value: stats.total_users, icon: Users, color: "text-primary" },
    { label: "New (7d)", value: stats.new_users_7d, icon: TrendingUp, color: "text-green-500" },
    { label: "New (30d)", value: stats.new_users_30d, icon: TrendingUp, color: "text-green-400" },
    { label: "Total Matches", value: stats.total_matches, icon: Heart, color: "text-pink-500",
      trend: stats.prev_matches_7d > 0 ? Math.round(((stats.matches_7d - stats.prev_matches_7d) / stats.prev_matches_7d) * 100) : null },
    { label: "Total Messages", value: stats.total_messages, icon: MessageSquare, color: "text-blue-400",
      trend: stats.prev_messages_7d > 0 ? Math.round(((stats.messages_7d - stats.prev_messages_7d) / stats.prev_messages_7d) * 100) : null },
    { label: "Premium Subscribers", value: stats.active_subscribers, icon: Crown, color: "text-yellow-500" },
    { label: "DAU", value: stats.dau, icon: Users, color: "text-emerald-500" },
    { label: "WAU", value: stats.wau, icon: Users, color: "text-emerald-400" },
    { label: "Open Reports", value: stats.open_reports, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {kpis.map((k) => (
        <Card key={k.label} className="bg-card/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <k.icon className={cn("h-4 w-4", k.color)} />
              <span className="text-xs text-muted-foreground">{k.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{k.value?.toLocaleString() ?? 0}</span>
              {k.trend != null && (
                <span className={cn("text-xs flex items-center gap-0.5", k.trend >= 0 ? "text-green-500" : "text-destructive")}>
                  {k.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(k.trend)}%
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const perPage = 20;

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_admin_user_list", {
      _search: search,
      _filter: filter,
      _page: page,
      _per_page: perPage,
    });
    if (!error && data) {
      const d = data as any;
      setUsers(d.users || []);
      setTotal(d.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page, filter]);

  const doSearch = () => { setPage(1); fetchUsers(); };

  const logAction = async (action: string, targetId: string, details?: any) => {
    await supabase.from("audit_log").insert({
      admin_user_id: (await supabase.auth.getUser()).data.user?.id!,
      action,
      target_user_id: targetId,
      details: details || {},
    });
  };

  const toggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    setActionLoading(userId);
    try {
      if (currentlyAdmin) {
        await supabase.rpc("revoke_role", { _target_user_id: userId, _role: "admin" });
        await logAction("revoke_admin", userId);
      } else {
        await supabase.rpc("grant_role", { _target_user_id: userId, _role: "admin" });
        await logAction("grant_admin", userId);
      }
      toast.success(currentlyAdmin ? "Admin role revoked" : "Admin role granted (premium auto-applied)");
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
    setActionLoading(null);
  };

  const togglePremium = async (userId: string, currentlyPremium: boolean) => {
    setActionLoading(userId);
    try {
      if (currentlyPremium) {
        const { error } = await supabase.from("subscriptions").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subscriptions").upsert({
          user_id: userId, status: "active", plan: "premium", current_period_end: null,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        if (error) throw error;
      }
      await logAction(currentlyPremium ? "revoke_premium" : "grant_premium", userId);
      toast.success(currentlyPremium ? "Premium revoked" : "Premium granted");
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
    setActionLoading(null);
  };

  const suspendUser = async (userId: string, suspend: boolean) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase.rpc("admin_suspend_user", { _target_user_id: userId, _suspend: suspend });
      if (error) throw error;
      toast.success(suspend ? "User suspended" : "User unsuspended");
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
    setActionLoading(null);
  };

  const deleteUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      await logAction("delete_user", userId);
      const { error } = await supabase.functions.invoke("manage-account", {
        body: { action: "delete", targetUserId: userId },
      });
      if (error) throw error;
      toast.success("User deleted");
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete user");
    }
    setActionLoading(null);
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            className="flex-1"
          />
          <Button onClick={doSearch} size="sm"><Search className="h-4 w-4" /></Button>
        </div>
        <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="new">New (7d)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden sm:table-cell">Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
                ) : users.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.profile_image} />
                          <AvatarFallback>{(u.display_name || u.name || "?")[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{u.display_name || u.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.is_admin && <Badge variant="default" className="text-[10px] px-1.5">Admin</Badge>}
                        {u.is_premium && <Badge className="text-[10px] px-1.5 bg-yellow-600">Premium</Badge>}
                        {u.is_verified && <Badge variant="secondary" className="text-[10px] px-1.5">Verified</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {u.last_active_at ? new Date(u.last_active_at).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 flex-wrap">
                        <Button
                          size="sm" variant={u.is_admin ? "destructive" : "outline"}
                          className="h-7 text-xs px-2"
                          disabled={actionLoading === u.id}
                          onClick={() => toggleAdmin(u.id, u.is_admin)}
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          {u.is_admin ? "Revoke Admin" : "Grant Admin"}
                        </Button>
                        <Button
                          size="sm" variant={u.is_premium ? "destructive" : "outline"}
                          className="h-7 text-xs px-2"
                          disabled={actionLoading === u.id}
                          onClick={() => togglePremium(u.id, u.is_premium)}
                        >
                          <Crown className="h-3 w-3 mr-1" />
                          {u.is_premium ? "Revoke" : "Premium"}
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          className="h-7 text-xs px-2"
                          disabled={actionLoading === u.id}
                          onClick={() => suspendUser(u.id, u.churn_status !== "suspended")}
                        >
                          {u.churn_status === "suspended" ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" className="h-7 text-xs px-2" disabled={actionLoading === u.id}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {u.display_name || u.name}?</AlertDialogTitle>
                              <AlertDialogDescription>This action is permanent and cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteUser(u.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{total} user{total !== 1 ? "s" : ""}</span>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2 py-1">{page}/{totalPages || 1}</span>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Content Management Tab ─────────────────────────────────
const ContentManagementTab = () => {
  const [modules, setModules] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState("modules");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [mods, res, evts] = await Promise.all([
        supabase.from("education_modules").select("id, title, slug, description, tier, order_index, is_required, is_optional").order("order_index"),
        supabase.from("recommended_resources").select("*").order("order_index"),
        supabase.from("events").select("*").order("event_date", { ascending: false }).limit(50),
      ]);
      setModules(mods.data || []);
      setResources(res.data || []);
      setEvents(evts.data || []);
      setLoading(false);
    })();
  }, []);

  const toggleModuleRequired = async (id: string, current: boolean) => {
    await supabase.from("education_modules").update({ is_required: !current }).eq("id", id);
    setModules(prev => prev.map(m => m.id === id ? { ...m, is_required: !current } : m));
    toast.success(`Module ${!current ? "published" : "set to draft"}`);
  };

  const toggleEventActive = async (id: string, current: boolean) => {
    await supabase.from("events").update({ is_active: !current }).eq("id", id);
    setEvents(prev => prev.map(e => e.id === id ? { ...e, is_active: !current } : e));
    toast.success(`Event ${!current ? "activated" : "deactivated"}`);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["modules", "resources", "events"].map(t => (
          <Button key={t} size="sm" variant={activeSubTab === t ? "default" : "outline"} onClick={() => setActiveSubTab(t)} className="capitalize">
            {t === "modules" && <BookOpen className="h-3 w-3 mr-1" />}
            {t === "resources" && <Link2 className="h-3 w-3 mr-1" />}
            {t === "events" && <Calendar className="h-3 w-3 mr-1" />}
            {t}
          </Button>
        ))}
      </div>

      {activeSubTab === "modules" && (
        <div className="space-y-2">
          {modules.map(m => (
            <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/60">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{m.title}</p>
                <p className="text-xs text-muted-foreground">{m.tier} · {m.slug}</p>
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

      {activeSubTab === "resources" && (
        <div className="space-y-2">
          {resources.map(r => (
            <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/60">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.category}</p>
              </div>
              <Badge variant={r.is_featured ? "default" : "secondary"} className="text-[10px]">
                {r.is_featured ? "Featured" : "Standard"}
              </Badge>
            </div>
          ))}
          {resources.length === 0 && <p className="text-center text-muted-foreground py-4">No resources</p>}
        </div>
      )}

      {activeSubTab === "events" && (
        <div className="space-y-2">
          {events.map(e => (
            <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/60">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{e.title}</p>
                <p className="text-xs text-muted-foreground">{new Date(e.event_date).toLocaleDateString()} · {e.host_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={e.is_active ? "default" : "secondary"} className="text-[10px]">
                  {e.is_active ? "Active" : "Inactive"}
                </Badge>
                <Switch checked={e.is_active} onCheckedChange={() => toggleEventActive(e.id, e.is_active)} />
              </div>
            </div>
          ))}
          {events.length === 0 && <p className="text-center text-muted-foreground py-4">No events</p>}
        </div>
      )}
    </div>
  );
};

// ─── Reports Tab ────────────────────────────────────────────
const ReportsTab = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setReports(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const resolveReport = async (id: string, status: string) => {
    setActionLoading(id);
    const adminId = (await supabase.auth.getUser()).data.user?.id;
    await supabase.from("reports").update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
    }).eq("id", id);

    await supabase.from("audit_log").insert({
      admin_user_id: adminId!,
      action: `report_${status}`,
      target_user_id: reports.find(r => r.id === id)?.reported_user_id,
      details: { report_id: id },
    });

    toast.success(`Report ${status}`);
    fetchReports();
    setActionLoading(null);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      {reports.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No reports 🎉</p>
      ) : reports.map(r => (
        <Card key={r.id} className="bg-card/60">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Flag className="h-3 w-3 text-destructive" />
                  <Badge variant={r.status === "pending" ? "destructive" : "secondary"} className="text-[10px]">{r.status}</Badge>
                </div>
                <p className="text-sm font-medium">{r.reason}</p>
                {r.details && <p className="text-xs text-muted-foreground mt-1">{r.details}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              {r.status === "pending" && (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs" disabled={actionLoading === r.id}
                    onClick={() => resolveReport(r.id, "dismissed")}>
                    <XCircle className="h-3 w-3 mr-1" />Dismiss
                  </Button>
                  <Button size="sm" variant="destructive" className="h-7 text-xs" disabled={actionLoading === r.id}
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
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(50);
    setAnnouncements(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const sendAnnouncement = async () => {
    if (!message.trim()) return;
    setSending(true);
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { error } = await supabase.from("announcements").insert({
      message: message.trim(),
      target_audience: audience,
      created_by: userId!,
    });
    if (error) {
      toast.error("Failed to send announcement");
    } else {
      toast.success("Announcement sent!");
      setMessage("");
      fetchAnnouncements();
    }
    setSending(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("announcements").update({ is_active: !current }).eq("id", id);
    fetchAnnouncements();
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card/60">
        <CardContent className="p-4 space-y-3">
          <Textarea
            placeholder="Write an announcement..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <div className="flex items-center gap-2">
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="premium">Premium Only</SelectItem>
                <SelectItem value="free">Free Only</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={sendAnnouncement} disabled={sending || !message.trim()} size="sm">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {announcements.map(a => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/60">
              <div className="min-w-0 flex-1">
                <p className="text-sm">{a.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(a.created_at).toLocaleDateString()} · {a.target_audience}
                </p>
              </div>
              <Switch checked={a.is_active} onCheckedChange={() => toggleActive(a.id, a.is_active)} />
            </div>
          ))}
          {announcements.length === 0 && <p className="text-center text-muted-foreground py-4">No announcements yet</p>}
        </div>
      )}
    </div>
  );
};

// ─── Audit Log Tab ──────────────────────────────────────────
const AuditLogTab = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(100);
      setLogs(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-2">
      {logs.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No admin actions logged yet</p>
      ) : logs.map(l => (
        <div key={l.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/60 text-sm">
          <div>
            <span className="font-medium">{l.action}</span>
            {l.target_user_id && <span className="text-muted-foreground ml-2 text-xs">target: {l.target_user_id.slice(0, 8)}…</span>}
          </div>
          <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
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
    if (!loading && !isAdmin) {
      navigate("/", { replace: true });
    }
  }, [loading, isAdmin, navigate]);

  if (loading) return <PageLoader />;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Logo size="sm" />
          <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
            <Shield className="h-3 w-3 mr-1" /> Admin Dashboard
          </Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-4">
        <Tabs defaultValue="overview">
          <TabsList className="w-full flex overflow-x-auto h-auto flex-wrap gap-1">
            <TabsTrigger value="overview" className="text-xs gap-1 flex-1 min-w-[80px]">
              <BarChart3 className="h-3 w-3" /> Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs gap-1 flex-1 min-w-[80px]">
              <Users className="h-3 w-3" /> Users
            </TabsTrigger>
            <TabsTrigger value="content" className="text-xs gap-1 flex-1 min-w-[80px]">
              <BookOpen className="h-3 w-3" /> Content
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-xs gap-1 flex-1 min-w-[80px]">
              <Flag className="h-3 w-3" /> Reports
            </TabsTrigger>
            <TabsTrigger value="announcements" className="text-xs gap-1 flex-1 min-w-[80px]">
              <Megaphone className="h-3 w-3" /> Announce
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs gap-1 flex-1 min-w-[80px]">
              <Shield className="h-3 w-3" /> Audit
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="overview"><OverviewTab /></TabsContent>
            <TabsContent value="users"><UserManagementTab /></TabsContent>
            <TabsContent value="content"><ContentManagementTab /></TabsContent>
            <TabsContent value="reports"><ReportsTab /></TabsContent>
            <TabsContent value="announcements"><AnnouncementsTab /></TabsContent>
            <TabsContent value="audit"><AuditLogTab /></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
