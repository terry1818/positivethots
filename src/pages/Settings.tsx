import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useLocationSharing } from "@/hooks/useLocationSharing";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, Sun, Moon, Monitor, KeyRound, Download, Trash2, FileText, Shield, ExternalLink, Crown, Loader2, MapPin, Lock, Gift, Copy, Users, Check, Ticket, Send, UserCog, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { isPremium, tier, loading: subLoading, subscriptionEnd } = useSubscription();
  const { isUnlocked: locationUnlocked, isSharing, toggleSharing, error: locationError, loading: locationLoading } = useLocationSharing();
  const { isAdmin, userId: adminUserId } = useAdminRole();
  const [isOwner, setIsOwner] = useState(false);

  // Admin tools
  const [adminEmail, setAdminEmail] = useState("");
  const [adminRole, setAdminRole] = useState<string>("moderator");
  const [grantingRole, setGrantingRole] = useState(false);
  const [roleHolders, setRoleHolders] = useState<any[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Account actions
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [managingPortal, setManagingPortal] = useState(false);

  // Promo code generation
  const [codeType, setCodeType] = useState<"gift" | "referral">("referral");
  const [giftTier, setGiftTier] = useState("premium");
  const [giftDays, setGiftDays] = useState("14");
  const [creatingCode, setCreatingCode] = useState(false);
  const [myCodes, setMyCodes] = useState<any[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Send Gift
  const [giftEmail, setGiftEmail] = useState("");
  const [sendingGift, setSendingGift] = useState(false);

  const loadMyCodes = useCallback(async () => {
    const { data } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });
    setMyCodes(data || []);
    setLoadingCodes(false);
  }, []);

  useEffect(() => {
    loadMyCodes();
  }, [loadMyCodes]);

  // Check owner role from database
  useEffect(() => {
    const checkOwner = async () => {
      if (!adminUserId) return;
      const { data } = await supabase.rpc("has_role", { _user_id: adminUserId, _role: "owner" as any });
      setIsOwner(data === true);
    };
    checkOwner();
  }, [adminUserId]);

  // Admin: load role holders
  const loadRoleHolders = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingRoles(true);
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      setRoleHolders(data || []);
    } catch (err) {
      console.error("Failed to load roles:", err);
    } finally {
      setLoadingRoles(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) loadRoleHolders();
  }, [isAdmin, loadRoleHolders]);

  const handleGrantRole = async () => {
    if (!adminEmail.trim()) return;
    setGrantingRole(true);
    try {
      const { data: targetUserId, error: lookupError } = await supabase.rpc("get_user_id_by_email", { _email: adminEmail.trim() });
      if (lookupError) throw lookupError;

      const { error } = await supabase.rpc("grant_role", {
        _target_user_id: targetUserId,
        _role: adminRole as any,
      });
      if (error) throw error;
      toast.success(`${adminRole} role granted to ${adminEmail}`);
      setAdminEmail("");
      await loadRoleHolders();
    } catch (err: any) {
      toast.error(err.message || "Failed to grant role");
    } finally {
      setGrantingRole(false);
    }
  };

  const handleRevokeRole = async (targetUserId: string, role: string) => {
    setRevokingId(targetUserId + role);
    try {
      const { error } = await supabase.rpc("revoke_role", {
        _target_user_id: targetUserId,
        _role: role as any,
      });
      if (error) throw error;
      toast.success("Role revoked");
      await loadRoleHolders();
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke role");
    } finally {
      setRevokingId(null);
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateCode = async () => {
    setCreatingCode(true);
    try {
      const code = generateCode();
      const { error } = await supabase.from("promo_codes").insert({
        code,
        type: codeType,
        tier: codeType === "gift" ? giftTier : "premium",
        trial_days: codeType === "gift" ? parseInt(giftDays) : 14,
        created_by: user!.id,
      });
      if (error) throw error;
      toast.success(`${codeType === "gift" ? "Gift" : "Referral"} code created: ${code}`);
      await loadMyCodes();
    } catch (err: any) {
      toast.error(err.message || "Failed to create code");
    } finally {
      setCreatingCode(false);
    }
  };

  const copyCode = (code: string) => {
    const isReferral = myCodes.find(c => c.code === code)?.type === "referral";
    const text = isReferral
      ? `https://positivethots.lovable.app/auth?ref=${code}`
      : code;
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const themeOptions = [
    { value: "light", label: "Light", desc: "Always use light mode", icon: Sun },
    { value: "dark", label: "Dark", desc: "Always use dark mode", icon: Moon },
    { value: "system", label: "System", desc: "Follow your device settings", icon: Monitor },
  ];

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-account", {
        body: { action: "export" },
      });
      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `positive-thots-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Your data has been exported!");
    } catch (error: any) {
      toast.error(error.message || "Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("manage-account", {
        body: { action: "delete" },
      });
      if (error) throw error;
      toast.success("Your account has been deleted. Goodbye!");
      await signOut();
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  const handleManageSubscription = async () => {
    setManagingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (error: any) {
      toast.error(error.message || "Failed to open subscription management");
    } finally {
      setManagingPortal(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} aria-label="Go back">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Logo size="md" />
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="flex-1 container max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Appearance */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg">Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={theme} onValueChange={setTheme} className="space-y-3">
              {themeOptions.map(({ value, label, desc, icon: Icon }, idx) => (
                <div
                  key={value}
                  className={cn(
                    "flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-all duration-300 animate-stagger-fade",
                    theme === value && "border-primary shadow-[0_0_12px_-4px_hsl(var(--primary)/0.3)] bg-primary/5"
                  )}
                  style={{ animationDelay: `${idx * 80}ms` }}
                  onClick={() => setTheme(value)}
                >
                  <RadioGroupItem value={value} id={value} />
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <Label htmlFor={value} className="flex-1 cursor-pointer">
                    <span className="font-medium">{label}</span>
                    <span className="block text-sm text-muted-foreground">{desc}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Admin Tools */}
        {isAdmin && (
          <Card className="animate-fade-in border-primary/30" style={{ animationDelay: "40ms" }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCog className="h-5 w-5 text-primary" /> Admin Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">Grant a Role</p>
                <Input
                  type="email"
                  placeholder="User's email address"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  maxLength={100}
                />
                <div className="flex gap-2">
                  <Select value={adminRole} onValueChange={setAdminRole}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {isOwner && <SelectItem value="admin">Admin</SelectItem>}
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleGrantRole}
                    disabled={grantingRole || !adminEmail.trim()}
                    className="flex-1"
                    size="sm"
                  >
                    {grantingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : "Grant Role"}
                  </Button>
                </div>
                {!isOwner && (
                  <p className="text-xs text-muted-foreground">
                    Only the app owner can grant or revoke admin roles.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Current Role Holders</p>
                {loadingRoles ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                  </div>
                ) : roleHolders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No roles assigned.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {roleHolders.map((rh) => (
                      <div key={rh.id} className="flex items-center justify-between p-2 rounded-md border text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-xs truncate max-w-[140px]">{rh.user_id}</span>
                          <Badge variant={rh.role === "admin" ? "default" : "secondary"} className="text-xs">
                            {rh.role}
                          </Badge>
                          {rh.user_id === OWNER_ID && (
                            <Badge variant="outline" className="text-xs">Owner</Badge>
                          )}
                        </div>
                        {rh.user_id !== user?.id && (isOwner || rh.role !== "admin") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleRevokeRole(rh.user_id, rh.role)}
                            disabled={revokingId === rh.user_id + rh.role}
                          >
                            {revokingId === rh.user_id + rh.role ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription */}
        <Card className="animate-fade-in" style={{ animationDelay: "80ms" }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5" /> Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking status…
              </div>
            ) : isPremium ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    <Crown className="h-3.5 w-3.5" /> {tier.charAt(0).toUpperCase() + tier.slice(1)} Active
                  </span>
                </div>
                {subscriptionEnd && (
                  <p className="text-sm text-muted-foreground">
                    Renews on {new Date(subscriptionEnd).toLocaleDateString()}
                  </p>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={handleManageSubscription}
                  disabled={managingPortal}
                >
                  <ExternalLink className="h-4 w-4" />
                  {managingPortal ? "Opening…" : "Manage Subscription"}
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">You're on the free plan.</p>
                <Button className="w-full" onClick={() => navigate("/premium")}>
                  <Crown className="h-4 w-4 mr-2" /> Choose a Plan
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Location Sharing */}
        <Card className="animate-fade-in" style={{ animationDelay: "90ms" }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Location Sharing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {locationLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking status…
              </div>
            ) : !locationUnlocked ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Locked</p>
                  <p className="text-xs text-muted-foreground">
                    Complete all 5 Foundation courses to unlock location sharing at events.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Share My Location</p>
                    <p className="text-xs text-muted-foreground">
                      {isSharing 
                        ? "Your location is visible to nearby users (auto-expires in 2 hours)"
                        : "Let nearby users find you at events"}
                    </p>
                  </div>
                  <Switch
                    checked={isSharing}
                    onCheckedChange={toggleSharing}
                  />
                </div>
                {locationError && (
                  <p className="text-xs text-destructive">{locationError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Your location is never stored permanently and expires automatically after 2 hours.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Promo & Referral Codes */}
        <Card className="animate-fade-in" style={{ animationDelay: "95ms" }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5" /> Promo & Referral Codes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium">Create a Code</p>
              <div className="flex gap-2 flex-wrap">
                <Select value={codeType} onValueChange={(v) => setCodeType(v as "gift" | "referral")}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="gift">Gift Trial</SelectItem>
                  </SelectContent>
                </Select>
                {codeType === "gift" && (
                  <>
                    <Select value={giftTier} onValueChange={setGiftTier}>
                      <SelectTrigger className="w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plus">Plus</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={giftDays} onValueChange={setGiftDays}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {codeType === "referral"
                  ? "Share your link — when your friend subscribes, you get 3 months Premium free!"
                  : `Gift a ${giftDays}-day free trial of ${giftTier.charAt(0).toUpperCase() + giftTier.slice(1)}`}
              </p>
              <Button onClick={handleCreateCode} disabled={creatingCode} className="w-full" size="sm">
                {creatingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Ticket className="h-4 w-4 mr-1" /> Generate Code</>}
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-1">
                <Users className="h-4 w-4" /> My Codes
              </p>
              {loadingCodes ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                </div>
              ) : myCodes.filter(c => c.created_by === user?.id).length === 0 ? (
                <p className="text-sm text-muted-foreground">No codes yet. Create one above!</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {myCodes.filter(c => c.created_by === user?.id).map((code) => (
                    <div key={code.id} className="flex items-center justify-between p-2 rounded-md border text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-medium">{code.code}</span>
                        <Badge variant={code.type === "referral" ? "default" : "secondary"} className="text-xs">
                          {code.type}
                        </Badge>
                        {code.type === "gift" && (
                          <span className="text-xs text-muted-foreground">
                            {code.tier} · {code.trial_days}d
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {code.redeemed_by ? (
                          <Badge variant="outline" className="text-xs">
                            {code.referred_subscribed ? "🎉 Subscribed" : "✅ Used"}
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => copyCode(code.code)}
                          >
                            {copiedCode === code.code ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                        {code.reward_granted && (
                          <Badge className="text-xs bg-primary/10 text-primary">
                            🏆 Reward!
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Send a Gift */}
        <Card className="animate-fade-in" style={{ animationDelay: "97ms" }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="h-5 w-5" /> Send a Gift
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Gift a free trial to a friend. We'll email them a redemption link.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Select value={giftTier} onValueChange={setGiftTier}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plus">Plus</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
              <Select value={giftDays} onValueChange={setGiftDays}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              type="email"
              placeholder="Recipient's email"
              value={giftEmail}
              onChange={(e) => setGiftEmail(e.target.value)}
              maxLength={100}
            />
            <Button
              className="w-full"
              size="sm"
              disabled={sendingGift || !giftEmail.trim()}
              onClick={async () => {
                setSendingGift(true);
                try {
                  const code = generateCode();
                  const { error } = await supabase.from("promo_codes").insert({
                    code,
                    type: "gift",
                    tier: giftTier,
                    trial_days: parseInt(giftDays),
                    created_by: user!.id,
                  });
                  if (error) throw error;

                  await supabase.functions.invoke("send-transactional-email", {
                    body: {
                      templateName: "gift-code",
                      recipientEmail: giftEmail.trim(),
                      idempotencyKey: `gift-${code}`,
                      templateData: {
                        code,
                        tier: giftTier.charAt(0).toUpperCase() + giftTier.slice(1),
                        days: giftDays,
                        senderName: user?.user_metadata?.name || "A friend",
                      },
                    },
                  });

                  toast.success(`Gift sent to ${giftEmail}!`);
                  setGiftEmail("");
                  await loadMyCodes();
                } catch (err: any) {
                  toast.error(err.message || "Failed to send gift");
                } finally {
                  setSendingGift(false);
                }
              }}
            >
              {sendingGift ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1" /> Send Gift</>}
            </Button>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <KeyRound className="h-5 w-5" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                maxLength={100}
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || newPassword.length < 6}
              className="w-full"
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </Button>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card className="animate-fade-in" style={{ animationDelay: "200ms" }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" /> Data & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleExportData}
              disabled={exporting}
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exporting..." : "Export My Data"}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => navigate("/privacy")}
            >
              <FileText className="h-4 w-4" />
              Privacy Policy
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => navigate("/terms")}
            >
              <FileText className="h-4 w-4" />
              Terms of Service
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="animate-fade-in border-destructive/30" style={{ animationDelay: "300ms" }}>
          <CardHeader>
            <CardTitle className="text-lg text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>This action cannot be undone. This will permanently delete your account and remove all your data including:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Your profile and photos</li>
                      <li>All matches and messages</li>
                      <li>Education progress, badges, and XP</li>
                      <li>Subscription (if active)</li>
                    </ul>
                    <p className="font-medium mt-3">Type "DELETE" to confirm:</p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  placeholder='Type "DELETE"'
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                />
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== "DELETE" || deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "Deleting..." : "Delete Forever"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              We recommend exporting your data before deletion.
            </p>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center py-4">
          Positive Thots v1.0 • Made with ❤️
        </p>
      </main>
    </div>
  );
};

export default Settings;
