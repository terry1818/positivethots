import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGroupChats } from "@/hooks/useGroupChats";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreateGroupChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateGroupChat = ({ open, onOpenChange }: CreateGroupChatProps) => {
  const { user } = useAuth();
  const { createGroup } = useGroupChats();
  const [name, setName] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    const loadMatches = async () => {
      setLoading(true);
      const { data: matchData } = await supabase
        .from("matches")
        .select("id, user1_id, user2_id")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      const partnerIds = (matchData || []).map(m =>
        m.user1_id === user.id ? m.user2_id : m.user1_id
      );
      if (partnerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, display_name, profile_image")
          .in("id", partnerIds);
        setMatches(profiles || []);
      }
      setLoading(false);
    };
    loadMatches();
  }, [open, user]);

  const toggleMember = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    if (selectedIds.size < 2) {
      toast.error("Select at least 2 people (3 total including you)");
      return;
    }
    if (!name.trim()) {
      toast.error("Give your group a name");
      return;
    }
    createGroup.mutate(
      { name: name.trim(), memberIds: [...selectedIds] },
      { onSuccess: () => { onOpenChange(false); setName(""); setSelectedIds(new Set()); } }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Group Chat</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm">Group Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value.slice(0, 50))}
              placeholder="e.g. Weekend Crew"
              className="mt-1"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground mt-1">{name.length}/50</p>
          </div>

          <div>
            <Label className="text-sm">
              Add Members ({selectedIds.size} selected, need 2+)
            </Label>
            <div className="mt-2 space-y-2 max-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : matches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No matches yet. Connect with people first!
                </p>
              ) : (
                matches.map(profile => (
                  <label
                    key={profile.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedIds.has(profile.id)}
                      onCheckedChange={() => toggleMember(profile.id)}
                    />
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile.profile_image || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {(profile.display_name || profile.name || "?")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">
                      {profile.display_name || profile.name}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <Button
            onClick={handleCreate}
            disabled={selectedIds.size < 2 || !name.trim() || createGroup.isPending}
            className="w-full"
          >
            {createGroup.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Group
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
