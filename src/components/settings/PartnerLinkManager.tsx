import { useState } from "react";
import { usePartnerLinks, RELATIONSHIP_LABELS, type PartnerLink } from "@/hooks/usePartnerLinks";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Search, Link2, Loader2, Info, X, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PolyculeConstellation } from "@/components/profiles/PolyculeConstellation";

const VISIBILITY_OPTIONS = [
  { value: "profile", label: "Visible on Profile", icon: Eye },
  { value: "matches_only", label: "Matches Only", icon: EyeOff },
  { value: "private", label: "Private", icon: Lock },
];

export const PartnerLinkManager = () => {
  const { user } = useAuth();
  const {
    activeLinks, pendingIncoming, pendingOutgoing,
    isLoading, sendRequest, respondToRequest, updateLink, unlinkPartner,
  } = usePartnerLinks();

  const [showLinkSheet, setShowLinkSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("Partner");
  const [editingLink, setEditingLink] = useState<PartnerLink | null>(null);
  const [unlinkTarget, setUnlinkTarget] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, display_name, profile_image")
        .neq("id", user?.id || "")
        .or(`display_name.ilike.%${query}%,name.ilike.%${query}%`)
        .limit(10);
      setSearchResults(data || []);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = (partnerId: string) => {
    sendRequest.mutate({ partnerId, label: selectedLabel });
    setShowLinkSheet(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Your Polycule
        </CardTitle>
        <Badge variant="outline" className="text-xs">{activeLinks.length}/5</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Constellation visualization */}
        {activeLinks.length > 0 && user && (
          <PolyculeConstellation userId={user.id} linkedPartners={activeLinks} />
        )}

        {activeLinks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Link a partner to build your polycule ✨
          </p>
        )}

        {/* Active partners list */}
        {activeLinks.map(link => {
          const profile = link.partner_profile;
          return (
            <div key={link.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Avatar className="h-12 w-12 ring-2 ring-primary/30">
                <AvatarImage src={profile?.profile_image || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {(profile?.display_name || profile?.name || "?")[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {profile?.display_name || profile?.name}
                </p>
                <p className="text-xs text-muted-foreground">{link.relationship_label}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditingLink(link)} aria-label="Edit link">
                <Info className="h-4 w-4" />
              </Button>
            </div>
          );
        })}

        {/* Pending incoming */}
        {pendingIncoming.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Pending Requests</Label>
            {pendingIncoming.map(link => (
              <div key={link.id} className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={link.partner_profile?.profile_image || undefined} />
                  <AvatarFallback className="bg-primary/20">
                    {(link.partner_profile?.name || "?")[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {link.partner_profile?.display_name || link.partner_profile?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">wants to link as "{link.relationship_label}"</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={() => respondToRequest.mutate({ linkId: link.id, accept: true })}
                    disabled={respondToRequest.isPending}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => respondToRequest.mutate({ linkId: link.id, accept: false })}
                    disabled={respondToRequest.isPending}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Link a partner button */}
        <Sheet open={showLinkSheet} onOpenChange={setShowLinkSheet}>
          <SheetTrigger asChild>
            <Button className="w-full" disabled={activeLinks.length >= 5}>
              <Plus className="h-4 w-4 mr-2" />
              Link a Partner
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Link a Partner</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm">Relationship Label</Label>
                <Select value={selectedLabel} onValueChange={setSelectedLabel}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_LABELS.map(label => (
                      <SelectItem key={label} value={label}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Search by Name</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search display name..."
                    value={searchQuery}
                    onChange={e => handleSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {searching && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}

              {searchResults.map(profile => (
                <div key={profile.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.profile_image || undefined} />
                    <AvatarFallback className="bg-primary/20">
                      {(profile.display_name || profile.name || "?")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <p className="flex-1 text-sm font-medium truncate">
                    {profile.display_name || profile.name}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => handleSendRequest(profile.id)}
                    disabled={sendRequest.isPending}
                  >
                    <Link2 className="h-3 w-3 mr-1" /> Link
                  </Button>
                </div>
              ))}

              {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No users found matching "{searchQuery}"
                </p>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Edit link sheet */}
        {editingLink && (
          <Sheet open={!!editingLink} onOpenChange={() => setEditingLink(null)}>
            <SheetContent side="bottom" className="max-h-[60vh]">
              <SheetHeader>
                <SheetTitle>Edit Link</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-sm">Relationship Label</Label>
                  <Select
                    value={editingLink.relationship_label || "Partner"}
                    onValueChange={val => updateLink.mutate({
                      linkId: editingLink.id,
                      updates: { relationship_label: val },
                    })}
                  >
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIP_LABELS.map(label => (
                        <SelectItem key={label} value={label}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm">Visibility</Label>
                  <Select
                    value={editingLink.visibility}
                    onValueChange={val => updateLink.mutate({
                      linkId: editingLink.id,
                      updates: { visibility: val },
                    })}
                  >
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VISIBILITY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    setUnlinkTarget(editingLink.id);
                    setEditingLink(null);
                  }}
                >
                  Unlink Partner
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* Unlink confirmation */}
        <AlertDialog open={!!unlinkTarget} onOpenChange={() => setUnlinkTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unlink Partner?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove them from your polycule. You can re-link later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (unlinkTarget) unlinkPartner.mutate(unlinkTarget);
                  setUnlinkTarget(null);
                }}
              >
                Unlink
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
